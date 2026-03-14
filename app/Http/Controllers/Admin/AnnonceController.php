<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AnnonceController extends Controller
{
    /**
     * Afficher la liste des annonces avec filtres.
     */
    public function index(Request $request)
    {
        $query = ActeLiturgique::with(['createur', 'family', 'membre'])
            ->where('est_annonce', true); // au lieu du scope annonces()

        // Filtres
        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('type_acte')) {
            $query->where('type_acte', $request->type_acte);
        }
        if ($request->filled('family_id')) {
            $query->where('family_id', $request->family_id);
        }
        if ($request->filled('date_debut')) {
            $query->whereDate('created_at', '>=', $request->date_debut);
        }
        if ($request->filled('date_fin')) {
            $query->whereDate('created_at', '<=', $request->date_fin);
        }
        if ($request->filled('recherche')) {
            $search = $request->recherche;
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhereJsonContains('details->titre', $search)
                    ->orWhereJsonContains('details->contenu', $search);
            });
        }

        // Tri
        $query->orderBy($request->get('sort', 'created_at'), $request->get('order', 'desc'));

        $annonces = $query->paginate(20)->withQueryString();

        // Statistiques rapides (remplacer les constantes par des chaînes)
        $stats = [
            'total' => ActeLiturgique::where('est_annonce', true)->count(),
            'soumises' => ActeLiturgique::where('est_annonce', true)->where('statut', 'soumise')->count(),
            'validees' => ActeLiturgique::where('est_annonce', true)->where('statut', 'validee')->count(),
            'publiees' => ActeLiturgique::where('est_annonce', true)->where('statut', 'publiee')->count(),
            'rejetees' => ActeLiturgique::where('est_annonce', true)->where('statut', 'rejetee')->count(),
        ];

        return Inertia::render('Admin/Annonce/Index', [
            'annonces' => $annonces,
            'filters' => $request->only(['statut', 'type_acte', 'family_id', 'date_debut', 'date_fin', 'recherche', 'sort', 'order']),
            'stats' => $stats,
        ]);
    }

    /**
     * Créer une nouvelle annonce (administration).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type_annonce' => 'required|string',
            'membre_id' => 'required|exists:users,id',
            'message' => 'required|string',
            'date_annonce' => 'required|date',
            'date_publication' => 'nullable|date',
            'date_expiration' => 'nullable|date|after:date_publication',
            'family_id' => 'nullable|exists:families,id',
            'est_principale' => 'boolean',
            'statut' => 'sometimes|in:soumise,validee,publiee,rejetee,archivee',
        ]);

        $reference = 'ANN-' . strtoupper(uniqid());

        $details = [
            'titre' => $validated['type_annonce'],
            'contenu' => $validated['message'],
        ];

        $annonce = ActeLiturgique::create([
            'reference' => $reference,
            'type_acte' => $validated['type_annonce'],
            'statut' => $validated['statut'] ?? 'soumise',
            'details' => $details,
            'date_publication' => $validated['date_publication'] ?? $validated['date_annonce'],
            'date_expiration' => $validated['date_expiration'] ?? null,
            'membre_id' => $validated['membre_id'],
            'classe_id' => null,
            'family_id' => $validated['family_id'] ?? null,
            'created_by' => Auth::id(),
            'est_annonce' => true,
            'est_principale' => $validated['est_principale'] ?? false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Annonce créée avec succès.',
            'annonce' => $annonce,
        ], 201);
    }

    /**
     * Afficher les détails d'une annonce.
     */
    public function show(int $id)
    {
        $annonce = ActeLiturgique::with(['createur', 'family', 'membre', 'conducteur', 'pasteur', 'publieePar'])
            ->where('est_annonce', true)
            ->findOrFail($id);

        return Inertia::render('Admin/Annonce/Show', [
            'annonce' => $annonce,
        ]);
    }

    /**
     * Valider une annonce (passe au statut VALIDEE).
     */
    public function validateAnnonce(Request $request, int $id)
    {
        $annonce = ActeLiturgique::where('est_annonce', true)->findOrFail($id);

        if ($annonce->statut !== 'soumise') {
            return response()->json([
                'success' => false,
                'message' => 'Seules les annonces soumises peuvent être validées.'
            ], 422);
        }

        $annonce->update([
            'statut' => 'validee',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Annonce validée avec succès.',
        ]);
    }

    /**
     * Publier une annonce (statut PUBLIEE, avec date de publication).
     */
    public function publish(Request $request, int $id)
    {
        $annonce = ActeLiturgique::where('est_annonce', true)->findOrFail($id);

        $validated = $request->validate([
            'date_publication' => 'nullable|date',
            'date_expiration' => 'nullable|date|after:date_publication',
        ]);

        $data = [
            'statut' => 'publiee',
            'publie_par' => Auth::id(),
        ];

        if (isset($validated['date_publication'])) {
            $data['date_publication'] = $validated['date_publication'];
        } elseif (!$annonce->date_publication) {
            $data['date_publication'] = now();
        }

        if (isset($validated['date_expiration'])) {
            $data['date_expiration'] = $validated['date_expiration'];
        }

        $annonce->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Annonce publiée avec succès.',
        ]);
    }

    /**
     * Rejeter une annonce avec motif.
     */
    public function reject(Request $request, int $id)
    {
        $annonce = ActeLiturgique::where('est_annonce', true)->findOrFail($id);

        $validated = $request->validate([
            'motif_rejet' => 'required|string|max:1000',
        ]);

        $annonce->update([
            'statut' => 'rejetee',
            'motif_rejet' => $validated['motif_rejet'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Annonce rejetée avec succès.',
        ]);
    }

    /**
     * Définir une annonce comme principale (est_principale = true).
     */
    public function setPrincipal(Request $request, int $id)
    {
        $annonce = ActeLiturgique::where('est_annonce', true)->findOrFail($id);

        $query = ActeLiturgique::where('est_annonce', true)->where('est_principale', true);
        if ($annonce->family_id) {
            $query->where('family_id', $annonce->family_id);
        } else {
            $query->whereNull('family_id');
        }

        $query->update(['est_principale' => false]);

        $annonce->update(['est_principale' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Annonce définie comme principale avec succès.',
        ]);
    }

    /**
     * Mettre à jour une annonce.
     */
    public function update(Request $request, int $id)
    {
        $annonce = ActeLiturgique::where('est_annonce', true)->findOrFail($id);

        $validated = $request->validate([
            'type_acte' => 'sometimes|string',
            'details' => 'sometimes|array',
            'details.titre' => 'sometimes|string',
            'details.contenu' => 'sometimes|string',
            'date_publication' => 'nullable|date',
            'date_expiration' => 'nullable|date|after:date_publication',
            'statut' => 'sometimes|in:soumise,validee,publiee,rejetee,archivee',
        ]);

        $annonce->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Annonce mise à jour avec succès.',
        ]);
    }

    /**
     * Supprimer une annonce (soft delete).
     */
    public function destroy(int $id)
    {
        $annonce = ActeLiturgique::where('est_annonce', true)->findOrFail($id);
        $annonce->delete();

        return response()->json([
            'success' => true,
            'message' => 'Annonce supprimée avec succès.',
        ]);
    }

    /**
     * Télécharger la fiche PDF.
     */
    public function fiche(int $id)
    {
        $annonce = ActeLiturgique::with(['createur', 'family', 'membre', 'conducteur', 'pasteur'])
            ->where('est_annonce', true)
            ->findOrFail($id);

        if (!in_array($annonce->statut, ['validee', 'publiee', 'archivee'], true)) {
            abort(403, 'La fiche PDF est disponible uniquement pour les annonces validées ou publiées.');
        }

        $pdf = Pdf::loadView('pdf.fiche-demande', ['acte' => $annonce])
            ->setPaper('a4', 'portrait');

        return $pdf->download("Annonce_{$annonce->reference}.pdf");
    }
}