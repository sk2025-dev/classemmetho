<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AnnonceController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Annonces publiées visibles par tous les membres de la famille
        $annoncesPubliees = ActeLiturgique::with(['createur', 'family', 'membre'])
            ->annonces()
            ->publiees()
            ->when($user->family_id, function ($query) use ($user) {
                // Les membres peuvent voir les annonces de leur famille ou publiques
                $query->where(function ($q) use ($user) {
                    $q->where('family_id', $user->family_id)
                        ->orWhereNull('family_id');
                });
            })
            ->orderBy('date_publication', 'desc')
            ->paginate(10, ['*'], 'publiques_page');

        // Annonces en attente de validation créées par la famille
        $mesAnnonces = ActeLiturgique::with(['createur', 'membre'])
            ->annonces()
            ->where('created_by', $user->id)
            ->orWhere('family_id', $user->family_id)
            ->orderBy('created_at', 'desc')
            ->paginate(10, ['*'], 'mesannonces_page');

        return Inertia::render('ResponsableFamille/Annonce/Index', [
            'annoncesPubliees' => $annoncesPubliees,
            'mesAnnonces' => $mesAnnonces,
        ]);
    }

    public function create()
    {
        return Inertia::render('ResponsableFamille/Annonce/Create');
    }

    public function store(Request $request)
    {
        // Support both frontend format and standard format
        $validated = $request->validate([
            'type_acte'        => 'nullable|in:annonce,annonce_liturgique,priere,grace,deces,generale',
            'type_annonce'     => 'nullable|string',
            'motif'              => 'nullable|string|max:100',
            'temoignage_public'  => 'nullable|boolean',
            'membre_id'        => 'required|exists:users,id',
            'details.titre'    => 'nullable|string|max:255',
            'details.contenu'  => 'nullable|string',
            'message'          => 'nullable|string',
            'date_publication' => 'nullable|date',
            'date_annonce'     => 'nullable|date',
            'heure_culte'      => 'nullable|string|max:10',
            'date_expiration'  => 'nullable|date|after:date_publication',
        ]);

        $user = Auth::user();
        $membre = User::findOrFail($validated['membre_id']);

        // Ensure member is from the same family
        if ($membre->family_id !== $user->family_id) {
            return response()->json([
                'success' => false,
                'message' => 'Ce membre ne figure pas dans votre famille.',
            ], 403);
        }

        // Map frontend field names to backend format
        $typeAnnonce = $validated['type_acte'] ?? $validated['type_annonce'] ?? 'generale';

        // Map frontend details to backend format
        $titre = $validated['details']['titre'] ?? $validated['message'] ?? '';
        $contenu = $validated['details']['contenu'] ?? $validated['message'] ?? '';

        // Map other frontend fields to details
        $details = [
            'titre'             => $titre,
            'contenu'           => $contenu,
            'motif'             => $validated['motif'] ?? null,
            'temoignage_public' => $validated['temoignage_public'] ?? false,
            'heure_culte'       => $validated['heure_culte'] ?? null,
        ];

        // Use date_annonce if date_publication is not set
        $datePublication = $validated['date_publication'] ?? $validated['date_annonce'] ?? now();

        // Generate unique reference
        $reference = 'ANN-' . strtoupper(uniqid());

        $acte = ActeLiturgique::create([
            'reference' => $reference,
            'type_acte' => $typeAnnonce,
            'statut' => ActeLiturgique::STATUT_Soumise,
            'details' => $details,
            'date_souhaitee' => $validated['date_annonce'] ?? now(),
            'date_publication' => $datePublication,
            'date_expiration' => $validated['date_expiration'] ?? null,
            'membre_id' => $validated['membre_id'], // Store member ID
            // associate announcement to the member's class when possible so conducteurs
            // responsible for that class will automatically see it
            'classe_id' => $membre->classe_id,
            'family_id' => $user->family_id,
            'created_by' => $user->id,
            'est_annonce' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Annonce créée avec succès.',
            'annonce' => $acte,
        ]);
    }

    public function show(int $id)
    {
        $acte = ActeLiturgique::with(['createur', 'family', 'conducteur', 'pasteur', 'publieePar'])
            ->annonces()
            ->findOrFail($id);

        return Inertia::render('ResponsableFamille/Annonce/Show', [
            'annonce' => $acte,
        ]);
    }

    public function edit(int $id)
    {
        $acte = ActeLiturgique::annonces()->findOrFail($id);
        $user = Auth::user();

        if (!$acte->peutEtreModifiePar($user)) {
            abort(403, 'Vous ne pouvez pas modifier cette annonce.');
        }

        return Inertia::render('ResponsableFamille/Annonce/Edit', [
            'annonce' => $acte,
        ]);
    }

    public function update(Request $request, int $id)
    {
        $acte = ActeLiturgique::annonces()->findOrFail($id);
        $user = Auth::user();

        if (!$acte->peutEtreModifiePar($user)) {
            abort(403, 'Vous ne pouvez pas modifier cette annonce.');
        }

        $validated = $request->validate([
            'type_acte' => 'required|in:annonce,annonce_liturgique',
            'details.titre' => 'required|string|max:255',
            'details.contenu' => 'required|string',
            'date_publication' => 'nullable|date',
            'date_expiration' => 'nullable|date|after:date_publication',
        ]);

        $acte->update([
            'type_acte' => $validated['type_acte'],
            'details' => [
                'titre' => $validated['details']['titre'],
                'contenu' => $validated['details']['contenu'],
            ],
            'date_publication' => $validated['date_publication'],
            'date_expiration' => $validated['date_expiration'],
            'updated_by' => $user->id,
            // Remettre en attente si elle était validée
            'statut' => in_array($acte->statut, [ActeLiturgique::STATUT_EN_ATTENTE_CONDUCTEUR, ActeLiturgique::STATUT_VALIDEE])
                ? ActeLiturgique::STATUT_Soumise
                : $acte->statut,
        ]);

        return redirect()->route('responsable_famille.annonces.index')
            ->with('success', 'Annonce mise à jour.');
    }

    public function destroy(int $id)
    {
        $acte = ActeLiturgique::annonces()->findOrFail($id);
        $user = Auth::user();

        if (!$acte->peutEtreModifiePar($user)) {
            abort(403, 'Vous ne pouvez pas supprimer cette annonce.');
        }

        $acte->delete();

        return redirect()->route('responsable_famille.annonces.index')
            ->with('success', 'Annonce supprimée.');
    }

    public function fiche(int $id)
    {
        $acte = ActeLiturgique::with([
            'createur',
            'family',
            'conducteur',
            'bureauConducteur',
            'pasteur',
            'membre.classe',
            'historiques.acteur',
        ])->annonces()->findOrFail($id);

        $user = Auth::user();

        // Vérifier que l'utilisateur appartient à la même famille
        if ($acte->family_id !== $user->family_id && $acte->created_by !== $user->id) {
            abort(403, 'Vous n\'avez pas accès à cette fiche.');
        }

        // Fallback conducteur : chercher dans l'historique celui qui a transmis au Bureau
        if (!$acte->conducteur) {
            $hist = $acte->historiques
                ->filter(fn ($h) => in_array($h->statut_nouveau, [
                    ActeLiturgique::STATUT_TRANSMISE_AU_BUREAU_CONDUCTEUR,
                    ActeLiturgique::STATUT_EN_ATTENTE_CONDUCTEUR,
                ]) && strtolower((string) ($h->acteur?->role ?? '')) === 'conducteur')
                ->sortBy('created_at')
                ->first();
            if ($hist?->acteur) {
                $acte->setRelation('conducteur', $hist->acteur);
            }
        }

        $typeActe = strtolower((string) $acte->type_acte);

        // Statuts autorisant le téléchargement dès la validation conducteur
        $statutsAutorises = [
            'TRANSMISE_AU_BUREAU_CONDUCTEUR',
            'TRANSMISE_AU_PASTEUR',
            'VALIDEE', 'PUBLIEE', 'ARCHIVEE',
        ];

        if ($typeActe === 'naissance') {
            // Naissance : disponible dès la soumission
            $statutsAutorises = array_merge(
                ['SOUMISE', 'EN_ATTENTE_CONDUCTEUR'],
                $statutsAutorises
            );
        }

        if (!in_array($acte->statut, $statutsAutorises, true)) {
            abort(403, 'La fiche est disponible après validation par le conducteur.');
        }

        $logoDataUri  = $this->buildImageDataUri(public_path('images/logo.png'));
        $methoDataUri = $this->buildImageDataUri(public_path('images/metho.jpg'));
        $view = $typeActe === 'deces' ? 'pdf.fiche-deces' : 'pdf.fiche-demande';

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($view, [
            'acte'         => $acte,
            'logoDataUri'  => $logoDataUri,
            'methoDataUri' => $methoDataUri,
        ])->setPaper('a4', 'portrait');

        $prefix = in_array($typeActe, ['priere', 'grace', 'felicitations']) ? 'Priere' : 'Fiche';
        return $pdf->stream("{$prefix}_{$acte->reference}.pdf");
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
