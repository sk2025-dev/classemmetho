<?php

namespace App\Http\Controllers\Pasteur;

use Barryvdh\DomPDF\Facade\Pdf;
use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use App\Models\ActeLiturgiqueHistorique;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class AnnonceController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // Annonces en attente de validation du pasteur
        $enAttente = ActeLiturgique::with(['createur', 'family', 'conducteur', 'membre'])
            ->annonces()
            ->where('statut', ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR)
            ->orderBy('updated_at', 'desc')
            ->paginate(10, ['*'], 'enAttente_page');

        // Annonces validées en attente de publication (legacy)
        $validees = ActeLiturgique::with(['createur', 'family', 'conducteur', 'pasteur', 'membre'])
            ->annonces()
            ->where('statut', ActeLiturgique::STATUT_VALIDEE)
            ->orderBy('updated_at', 'desc')
            ->paginate(10, ['*'], 'validees_page');

        // Historique des annonces traitées
        $historique = ActeLiturgique::with(['createur', 'family', 'conducteur', 'pasteur', 'publieePar', 'membre'])
            ->annonces()
            ->whereIn('statut', [
                ActeLiturgique::STATUT_REFUSEE_PAR_PASTEUR,
                ActeLiturgique::STATUT_PUBLIEE,
                ActeLiturgique::STATUT_ARCHIVEE,
            ])
            ->orderBy('updated_at', 'desc')
            ->paginate(50, ['*'], 'historique_page');

        return Inertia::render('Pasteur/Annonce/Index', [
            'enAttente' => $enAttente,
            'validees' => $validees,
            'historique' => $historique,
        ]);
    }

    public function show(int $id)
    {
        $acte = ActeLiturgique::with(['createur', 'family', 'conducteur', 'pasteur', 'publieePar', 'membre'])
            ->annonces()
            ->findOrFail($id);

        return Inertia::render('Pasteur/Annonce/Show', [
            'annonce' => $acte,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type_annonce'     => 'required|string',
            'motif'              => 'nullable|string|max:100',
            'temoignage_public'  => 'nullable|boolean',
            'membre_id'        => 'nullable|exists:users,id',
            'details.titre'    => 'nullable|string|max:255',
            'details.contenu'  => 'nullable|string',
            'message'          => 'nullable|string',
            'date_publication' => 'nullable|date',
            'date_annonce'     => 'nullable|date',
            'date_expiration'  => 'nullable|date|after:date_publication',
        ]);

        $user = Auth::user();
        $membre = null;
        if (!empty($validated['membre_id'])) {
            $membre = User::findOrFail($validated['membre_id']);
        }

        $type    = $validated['type_annonce'] ?? 'generale';
        $titre   = $validated['details']['titre'] ?? $validated['message'] ?? '';
        $contenu = $validated['details']['contenu'] ?? $validated['message'] ?? '';
        $details = [
            'titre'             => $titre,
            'contenu'           => $contenu,
            'motif'             => $validated['motif'] ?? null,
            'temoignage_public' => $validated['temoignage_public'] ?? false,
        ];
        $datePublication = $validated['date_publication'] ?? now();
        $reference = 'ANN-' . strtoupper(uniqid());

        $acte = ActeLiturgique::create([
            'reference' => $reference,
            'type_acte' => $type,
            'statut' => ActeLiturgique::STATUT_VALIDEE,
            'details' => $details,
            'date_souhaitee' => $validated['date_annonce'] ?? now(),
            'date_publication' => $datePublication,
            'date_expiration' => $validated['date_expiration'] ?? null,
            'membre_id' => $validated['membre_id'] ?? null,
            'classe_id' => $membre?->classe_id ?? null,
            'family_id' => $user->family_id,
            'created_by' => $user->id,
            'conducteur_id' => $user->id,
            'pasteur_id' => $user->id,
            'est_annonce' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Annonce créée avec succès.',
            'annonce' => $acte,
        ]);
    }

    public function valider(Request $request, int $id)
    {
        $acte = ActeLiturgique::annonces()->findOrFail($id);
        $user = Auth::user();

        if ($acte->statut !== ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR) {
            return response()->json([
                'success' => false,
                'message' => 'Cette annonce ne peut pas être validée.',
            ], 403);
        }

        if (!in_array($user->role, ['pasteur', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas valider cette annonce.',
            ], 403);
        }

        $statutPrecedent = $acte->statut;

        // Validation pastorale + publication immédiate
        $acte->update([
            'statut' => ActeLiturgique::STATUT_PUBLIEE,
            'pasteur_id' => $user->id,
            'note_pastorale' => $request->input('note', null),
            'date_publication' => $acte->date_publication ?? now(),
            'publiee_par' => $user->id,
            'updated_by' => $user->id,
        ]);

        ActeLiturgiqueHistorique::create([
            'acte_id'         => $acte->id,
            'statut_precedent' => $statutPrecedent,
            'statut_nouveau'  => ActeLiturgique::STATUT_PUBLIEE,
            'acteur_id'       => $user->id,
            'commentaire'     => $request->input('note', null),
        ]);

        $this->notifierSecretariat($acte->fresh());

        return response()->json([
            'success' => true,
            'message' => 'Annonce validée et publiée avec succès.',
        ]);
    }

    /**
     * Le secrétariat est notifié dès qu'une demande de prière est validée
     * par le pasteur, afin de pouvoir l'archiver ou l'imprimer.
     */
    private function notifierSecretariat(ActeLiturgique $acte): void
    {
        $secretaires = User::query()
            ->where('is_secretariat', true)
            ->whereNotNull('email')
            ->get();

        if ($secretaires->isEmpty()) {
            return;
        }

        $concerne = $acte->membre ? "{$acte->membre->prenom} {$acte->membre->nom}" : null;
        $sujet = "Demande de prière validée — {$acte->reference}";
        $corps = "Bonjour,\n\n"
            . "Le pasteur vient de valider et publier la demande de prière (réf. {$acte->reference}"
            . ($concerne ? ", pour {$concerne}" : '') . ").\n\n"
            . "Vous pouvez maintenant l'archiver ou l'imprimer depuis votre tableau de bord secrétariat.\n\n"
            . 'Bien cordialement.';

        foreach ($secretaires as $secretaire) {
            try {
                Notification::create([
                    'user_id' => $secretaire->id,
                    'channel' => 'in_app',
                    'to'      => $secretaire->email,
                    'subject' => $sujet,
                    'body'    => "La demande de prière (Réf {$acte->reference}) a été validée par le pasteur.",
                    'data'    => ['link' => config('app.url') . '/secretariat/dashboard'],
                    'sent_at' => now(),
                ]);
            } catch (\Throwable $e) {
                Log::warning('Echec creation notification secretariat', [
                    'acte_id' => $acte->id,
                    'secretaire_id' => $secretaire->id,
                    'error' => $e->getMessage(),
                ]);
            }

            try {
                Mail::raw($corps, function ($message) use ($secretaire, $sujet) {
                    $message->to($secretaire->email)->subject($sujet);
                });
            } catch (\Throwable $e) {
                Log::warning('Echec envoi email secretariat', [
                    'acte_id' => $acte->id,
                    'secretaire_id' => $secretaire->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    public function rejeter(Request $request, int $id)
    {
        $acte = ActeLiturgique::annonces()->findOrFail($id);
        $user = Auth::user();

        if ($acte->statut !== ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR) {
            return response()->json([
                'success' => false,
                'message' => 'Cette annonce ne peut pas être rejetée.',
            ], 403);
        }

        if (!in_array($user->role, ['pasteur', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas rejeter cette annonce.',
            ], 403);
        }

        $validated = $request->validate([
            'motif_rejet' => 'required|string|min:10',
        ]);

        $statutPrecedent = $acte->statut;

        $acte->update([
            'statut' => ActeLiturgique::STATUT_REFUSEE_PAR_PASTEUR,
            'note_pastorale' => $validated['motif_rejet'],
            'pasteur_id' => $user->id,
            'updated_by' => $user->id,
        ]);

        ActeLiturgiqueHistorique::create([
            'acte_id'         => $acte->id,
            'statut_precedent' => $statutPrecedent,
            'statut_nouveau'  => ActeLiturgique::STATUT_REFUSEE_PAR_PASTEUR,
            'acteur_id'       => $user->id,
            'commentaire'     => $validated['motif_rejet'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Annonce rejetée.',
        ]);
    }

    public function publier(Request $request, int $id)
    {
        $acte = ActeLiturgique::annonces()->findOrFail($id);
        $user = Auth::user();

        if ($acte->statut !== ActeLiturgique::STATUT_VALIDEE) {
            return response()->json([
                'success' => false,
                'message' => 'Cette annonce doit d\'abord être validée par le pasteur.',
            ], 403);
        }

        if (!$acte->peutEtrePublieePar($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas publier cette annonce.',
            ], 403);
        }

        $validated = $request->validate([
            'date_publication' => 'nullable|date',
            'date_expiration' => 'nullable|date',
            'est_principale' => 'boolean',
        ]);

        // Si on veut mettre cette annonce comme principale, on retire le statut des autres
        if ($validated['est_principale'] ?? false) {
            ActeLiturgique::where('est_principale', true)
                ->where('type_acte', $acte->type_acte)
                ->update(['est_principale' => false]);
        }

        $acte->update([
            'statut' => ActeLiturgique::STATUT_PUBLIEE,
            'date_publication' => $validated['date_publication'] ?? now(),
            'date_expiration' => $validated['date_expiration'] ?? null,
            'est_principale' => $validated['est_principale'] ?? false,
            'publiee_par' => $user->id,
            'updated_by' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Annonce publiée avec succès.',
        ]);
    }

    public function archiver(int $id)
    {
        $acte = ActeLiturgique::annonces()->findOrFail($id);
        $user = Auth::user();

        if (!in_array($user->role, ['conducteur', 'pasteur', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas archiver cette annonce.',
            ], 403);
        }

        $acte->update([
            'statut' => ActeLiturgique::STATUT_ARCHIVEE,
            'updated_by' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Annonce archivée.',
        ]);
    }

    /**
     * Le pasteur modifie la date/l'heure du culte d'une demande de prière et
     * notifie toute la chaîne (chef de famille, conducteur, Bureau des
     * conducteurs) par email.
     */
    public function reprogrammer(Request $request, int $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['pasteur', 'admin'], true)) {
            return response()->json(['success' => false, 'message' => 'Accès non autorisé.'], 403);
        }

        $validated = $request->validate([
            'date_annonce' => 'required|date',
            'heure_culte' => 'nullable|string|max:10',
            'motif' => 'required|string|max:1000',
        ], [
            'motif.required' => 'Le motif du changement est obligatoire.',
        ]);

        $acte = ActeLiturgique::with(['createur', 'conducteur', 'bureauConducteur', 'membre'])
            ->annonces()
            ->findOrFail($id);

        $ancienneDate = optional($acte->date_souhaitee)->format('d/m/Y');
        $ancienneHeure = $acte->details['heure_culte'] ?? null;

        $details = $acte->details ?? [];
        $details['heure_culte'] = $validated['heure_culte'] ?? null;
        $details['motif_reprogrammation'] = $validated['motif'];

        $acte->update([
            'date_souhaitee' => $validated['date_annonce'],
            'details' => $details,
            'updated_by' => $user->id,
        ]);

        $this->notifierChaineReprogrammation($acte, $ancienneDate, $ancienneHeure, $validated['motif']);

        return response()->json([
            'success' => true,
            'message' => 'Date/heure mises à jour, la chaîne a été notifiée.',
            'annonce' => $acte->fresh(),
        ]);
    }

    private function notifierChaineReprogrammation(ActeLiturgique $acte, ?string $ancienneDate, ?string $ancienneHeure, string $motif): void
    {
        $nouvelleDate = optional($acte->date_souhaitee)->format('d/m/Y');
        $nouvelleHeure = $acte->details['heure_culte'] ?? null;
        $concerne = $acte->membre ? "{$acte->membre->prenom} {$acte->membre->nom}" : null;

        $sujet = "Modification de la date/heure — {$acte->reference}";
        $corps = "Bonjour,\n\n"
            . "La date et/ou l'heure de la demande de prière (réf. {$acte->reference}"
            . ($concerne ? ", pour {$concerne}" : '') . ") ont été modifiées par le pasteur.\n\n"
            . 'Ancienne date : ' . ($ancienneDate ?: '—') . ($ancienneHeure ? " à {$ancienneHeure}" : '') . "\n"
            . 'Nouvelle date : ' . ($nouvelleDate ?: '—') . ($nouvelleHeure ? " à {$nouvelleHeure}" : '') . "\n\n"
            . "Motif : {$motif}\n\n"
            . 'Bien cordialement.';

        $destinataires = collect([$acte->createur, $acte->conducteur, $acte->bureauConducteur])
            ->filter()
            ->unique('id')
            ->filter(fn ($u) => !empty($u->email));

        foreach ($destinataires as $destinataire) {
            try {
                Mail::raw($corps, function ($message) use ($destinataire, $sujet) {
                    $message->to($destinataire->email)->subject($sujet);
                });
            } catch (\Throwable $e) {
                Log::warning('Echec envoi notification reprogrammation', [
                    'acte_id' => $acte->id,
                    'destinataire' => $destinataire->email,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    public function fiche(int $id)
    {
        $acte = ActeLiturgique::with(['createur', 'family', 'conducteur', 'pasteur', 'membre'])->annonces()->findOrFail($id);
        $user = Auth::user();

        // Only pasteur and admin can view
        if (!in_array($user->role, ['pasteur', 'admin'])) {
            abort(403, 'Vous n\'avez pas accès à cette fiche.');
        }

        // PDF disponible uniquement après validation finale du pasteur
        if (!in_array($acte->statut, ['VALIDEE', 'PUBLIEE', 'ARCHIVEE'], true) || !$acte->pasteur_id) {
            abort(403, 'La fiche PDF est disponible uniquement après validation du pasteur.');
        }

        $logoDataUri = $this->buildImageDataUri(public_path('images/logo.png'));
        $view = $acte->type_acte === 'deces' ? 'pdf.fiche-deces' : 'pdf.fiche-demande';
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($view, [
            'acte' => $acte,
            'logoDataUri' => $logoDataUri,
        ])->setPaper('a4', 'portrait');

        $prefix = $acte->type_acte === 'priere' ? 'Priere' : 'Annonce';
        return $pdf->download("{$prefix}_{$acte->reference}.pdf");
    }

    private function buildImageDataUri(string $path): ?string
    {
        if (!file_exists($path)) {
            return null;
        }

        $type = pathinfo($path, PATHINFO_EXTENSION);
        $data = file_get_contents($path);
        if ($data === false) {
            return null;
        }

        return 'data:image/' . $type . ';base64,' . base64_encode($data);
    }
}
