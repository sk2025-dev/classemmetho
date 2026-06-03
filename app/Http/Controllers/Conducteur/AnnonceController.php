<?php

namespace App\Http\Controllers\Conducteur;

use Barryvdh\DomPDF\Facade\Pdf;
use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use App\Models\ActeLiturgiqueHistorique;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AnnonceController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();

        // Annonces en attente de validation (statut SOUMISE)
        $enAttente = ActeLiturgique::with(['createur', 'family'])
            ->annonces()
            ->where(function ($q) use ($classIds) {
                $q->whereIn('classe_id', $classIds)
                    ->orWhereNull('classe_id');
            })
            ->where('statut', ActeLiturgique::STATUT_Soumise)
            ->orderBy('created_at', 'desc')
            ->paginate(10, ['*'], 'enAttente_page');

        // Annonces validées par le conducteur en attente de publication
        $validees = ActeLiturgique::with(['createur', 'family', 'conducteur'])
            ->annonces()
            ->where(function ($q) use ($classIds) {
                $q->whereIn('classe_id', $classIds)
                    ->orWhereNull('classe_id');
            })
            ->where('statut', ActeLiturgique::STATUT_EN_ATTENTE_CONDUCTEUR)
            ->orderBy('updated_at', 'desc')
            ->paginate(10, ['*'], 'validees_page');

        // Annonces en attente de validation du pasteur
        $enAttentePasteur = ActeLiturgique::with(['createur', 'family', 'conducteur'])
            ->annonces()
            ->where(function ($q) use ($classIds) {
                $q->whereIn('classe_id', $classIds)
                    ->orWhereNull('classe_id');
            })
            ->where('statut', ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR)
            ->orderBy('updated_at', 'desc')
            ->paginate(10, ['*'], 'enAttentePasteur_page');

        // Historique des annonces traitées
        $historique = ActeLiturgique::with(['createur', 'family', 'conducteur', 'pasteur', 'publieePar'])
            ->annonces()
            ->where(function ($q) use ($classIds) {
                $q->whereIn('classe_id', $classIds)
                    ->orWhereNull('classe_id');
            })
            ->whereIn('statut', [
                ActeLiturgique::STATUT_VALIDEE,
                ActeLiturgique::STATUT_REFUSEE_PAR_CONDUCTEUR,
                ActeLiturgique::STATUT_REFUSEE_PAR_PASTEUR,
                ActeLiturgique::STATUT_PUBLIEE,
                ActeLiturgique::STATUT_ARCHIVEE,
            ])
            ->orderBy('updated_at', 'desc')
            ->paginate(50, ['*'], 'historique_page');

        return Inertia::render('Conducteur/Annonce/Index', [
            'enAttente' => $enAttente,
            'validees' => $validees,
            'enAttentePasteur' => $enAttentePasteur,
            'historique' => $historique,
        ]);
    }

    public function show(int $id)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();
        $acte = ActeLiturgique::with(['createur', 'family', 'conducteur', 'pasteur', 'publieePar'])
            ->annonces()
            ->where(function ($q) use ($classIds) {
                $q->whereIn('classe_id', $classIds)
                    ->orWhereNull('classe_id');
            })
            ->findOrFail($id);

        return Inertia::render('Conducteur/Annonce/Show', [
            'annonce' => $acte,
        ]);
    }

    public function storeFlashInfo(Request $request)
    {
        $validated = $request->validate([
            'titre'           => 'required|string|max:255',
            'contenu'         => 'required|string|max:2000',
            'date_expiration' => 'nullable|date|after:now',
            'membre_id'       => 'nullable|exists:users,id',
        ], [
            'titre.required'   => 'Le titre est obligatoire.',
            'contenu.required' => 'Le contenu est obligatoire.',
        ]);

        $user      = Auth::user();
        $reference = 'CDT-' . strtoupper(uniqid());

        $classeId = $user->classe_id ?? null;

        $acte = ActeLiturgique::create([
            'reference'       => $reference,
            'type_acte'       => 'generale',
            'statut'          => ActeLiturgique::STATUT_Soumise,
            'details'         => [
                'titre'   => $validated['titre'],
                'contenu' => $validated['contenu'],
            ],
            'date_souhaitee'  => now(),
            'date_publication'=> null,
            'date_expiration' => $validated['date_expiration'] ?? null,
            'created_by'      => $user->id,
            'conducteur_id'   => $user->id,
            'membre_id'       => $validated['membre_id'] ?? null,
            'classe_id'       => $classeId,
            'est_annonce'     => true,
            'family_id'       => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Annonce soumise. Elle sera publiée après validation par l\'administrateur.',
            'annonce' => $acte->fresh(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type_annonce'     => 'required|string',
            'motif'               => 'nullable|string|max:100',
            'temoignage_public'   => 'nullable|boolean',
            'membre_id'        => 'nullable|exists:users,id',
            'details.titre'    => 'nullable|string|max:255',
            'details.contenu'  => 'nullable|string',
            'message'          => 'nullable|string',
            'date_publication' => 'nullable|date',
            'date_annonce'     => 'nullable|date',
            'heure_culte'      => 'nullable|string|max:10',
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
            'titre'              => $titre,
            'contenu'            => $contenu,
            'motif'              => $validated['motif'] ?? null,
            'temoignage_public'  => $validated['temoignage_public'] ?? false,
            'heure_culte'        => $validated['heure_culte'] ?? null,
        ];
        $datePublication = $validated['date_publication'] ?? now();
        $reference = 'ANN-' . strtoupper(uniqid());

        $acte = ActeLiturgique::create([
            'reference' => $reference,
            'type_acte' => $type,
            'statut' => ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR,
            'details' => $details,
            'date_souhaitee' => $validated['date_annonce'] ?? now(),
            'date_publication' => $datePublication,
            'date_expiration' => $validated['date_expiration'] ?? null,
            'membre_id' => $validated['membre_id'] ?? null,
            'classe_id' => $membre?->classe_id ?? null,
            'family_id' => $user->family_id,
            'created_by' => $user->id,
            'conducteur_id' => $user->id,
            'est_annonce' => true,
        ]);

        $acte->load(['createur', 'family', 'membre', 'classe']);

        return response()->json([
            'success' => true,
            'message' => 'Annonce créée avec succès.',
            'annonce' => $acte,
        ]);
    }

    public function valider(Request $request, int $id)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();
        $acte = ActeLiturgique::annonces()
            ->where(function ($q) use ($classIds) {
                $q->whereIn('classe_id', $classIds)
                    ->orWhereNull('classe_id');
            })
            ->findOrFail($id);

        if (!$acte->peutEtreValideParConducteur($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas valider cette annonce.',
            ], 403);
        }

        // Pour les annonces générales, on peut directement validé et publié
        // Pour les annonces liturgiques, on transmet au pasteur
        $statutPrecedent = $acte->statut;
        $acte->update([
            'statut' => ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR,
            'conducteur_id' => $user->id,
            'note_conducteur' => $request->input('note', null),
            'updated_by' => $user->id,
        ]);

        ActeLiturgiqueHistorique::create([
            'acte_id'          => $acte->id,
            'statut_precedent' => $statutPrecedent,
            'statut_nouveau'   => ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR,
            'acteur_id'        => $user->id,
            'commentaire'      => $request->input('note', null),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Annonce validée avec succès.',
        ]);
    }

    public function transmettreAuPasteur(int $id)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();
        $acte = ActeLiturgique::annonces()
            ->where(function ($q) use ($classIds) {
                $q->whereIn('classe_id', $classIds)
                    ->orWhereNull('classe_id');
            })
            ->findOrFail($id);

        if ($acte->statut !== ActeLiturgique::STATUT_EN_ATTENTE_CONDUCTEUR) {
            return response()->json([
                'success' => false,
                'message' => 'Cette annonce ne peut pas être transmise au pasteur.',
            ], 403);
        }

        $acte->update([
            'statut' => ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR,
            'updated_by' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Annonce transmise au pasteur pour validation.',
        ]);
    }

    public function rejeter(Request $request, int $id)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();
        $acte = ActeLiturgique::annonces()
            ->where(function ($q) use ($classIds) {
                $q->whereIn('classe_id', $classIds)
                    ->orWhereNull('classe_id');
            })
            ->findOrFail($id);

        if (!$acte->peutEtreValideParConducteur($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas rejeter cette annonce.',
            ], 403);
        }

        $validated = $request->validate([
            'motif_rejet' => 'required|string|min:10',
        ]);

        $acte->update([
            'statut' => ActeLiturgique::STATUT_REFUSEE_PAR_CONDUCTEUR,
            'note_conducteur' => $validated['motif_rejet'],
            'conducteur_id' => $user->id,
            'updated_by' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Annonce rejetée.',
        ]);
    }

    public function publier(Request $request, int $id)
    {
        return response()->json([
            'success' => false,
            'message' => 'Seul le pasteur peut décider de la publication finale.',
        ], 403);
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
     * Download a PDF sheet for the announcement/prayer.
     * Conducteurs only see announcements attached to one of their classes
     * or public ones (classe_id NULL).
     */
    public function fiche(int $id)
    {
        $user = Auth::user();
        $classIds = $user->getManagedClasses()->pluck('id')->toArray();

        $acte = ActeLiturgique::with(['createur', 'family', 'conducteur', 'pasteur', 'membre', 'classe'])
            ->annonces()
            ->where(function ($q) use ($classIds) {
                $q->whereIn('classe_id', $classIds)
                    ->orWhereNull('classe_id');
            })
            ->findOrFail($id);

        // PDF disponible après validation du conducteur (transmission au pasteur)
        if (!in_array($acte->statut, ['TRANSMISE_AU_PASTEUR', 'VALIDEE', 'PUBLIEE', 'ARCHIVEE'], true)) {
            abort(403, 'La fiche PDF est disponible après transmission au pasteur.');
        }

        // Fallback conducteur : seul un conducteur gérant cette classe peut accéder ici
        if (!$acte->conducteur) {
            $acte->setRelation('conducteur', $user);
        }

        $logoPath = public_path('images/logo.png');
        $logoDataUri = null;
        if (file_exists($logoPath) && ($raw = @file_get_contents($logoPath)) !== false) {
            $ext = strtolower(pathinfo($logoPath, PATHINFO_EXTENSION) ?: 'png');
            $logoDataUri = 'data:image/' . $ext . ';base64,' . base64_encode($raw);
        }
        $view = $acte->type_acte === 'deces' ? 'pdf.fiche-deces' : 'pdf.fiche-demande';
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($view, [
            'acte' => $acte,
            'logoDataUri' => $logoDataUri,
        ])->setPaper('a4', 'portrait');

        $prefix = $acte->type_acte === 'priere' ? 'Priere' : 'Annonce';
        return $pdf->stream("{$prefix}_{$acte->reference}.pdf");
    }
}
