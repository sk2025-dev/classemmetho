<?php

namespace App\Http\Controllers\MembreFamille;

use Barryvdh\DomPDF\Facade\Pdf;
use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AnnonceController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // Annonces publiées visibles par tous les membres de la famille
        $annonces = ActeLiturgique::with(['createur', 'family'])
            ->annonces()
            ->publiees()
            ->when($user->family_id, function ($query) use ($user) {
                // Les membres peuvent voir les annonces de leur famille ou publiques
                $query->where(function ($q) use ($user) {
                    $q->where('family_id', $user->family_id)
                        ->orWhereNull('family_id');
                });
            })
            ->orderBy('est_principale', 'desc')
            ->orderBy('date_publication', 'desc')
            ->get();

        // Annonce principale (celle qui est mise en avant)
        $annoncePrincipale = ActeLiturgique::with(['createur', 'family'])
            ->annonces()
            ->publiees()
            ->principale()
            ->when($user->family_id, function ($query) use ($user) {
                $query->where(function ($q) use ($user) {
                    $q->where('family_id', $user->family_id)
                        ->orWhereNull('family_id');
                });
            })
            ->first();

        return Inertia::render('MembreFamille/Annonce/Index', [
            'annonces' => $annonces,
            'annoncePrincipale' => $annoncePrincipale,
        ]);
    }

    public function show(int $id)
    {
        $acte = ActeLiturgique::with(['createur', 'family', 'conducteur', 'pasteur', 'publieePar'])
            ->annonces()
            ->publiees()
            ->findOrFail($id);

        return Inertia::render('MembreFamille/Annonce/Show', [
            'annonce' => $acte,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type_annonce' => 'required|string',
            'membre_id' => 'required|exists:users,id',
            'message' => 'required|string',
            'date_annonce' => 'required|date',
            'date_publication' => 'nullable|date',
            'date_expiration' => 'nullable|date|after:date_publication',
        ]);

        $user = Auth::user();
        $membre = User::findOrFail($validated['membre_id']);

        if ((int) $membre->id !== (int) $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Un membre ne peut créer une annonce que pour lui-même.',
            ], 403);
        }

        $reference = 'ANN-' . strtoupper(uniqid());
        $details = [
            'titre' => $validated['message'],
            'contenu' => $validated['message'],
        ];

        $annonce = ActeLiturgique::create([
            'reference' => $reference,
            'type_acte' => $validated['type_annonce'],
            'statut' => ActeLiturgique::STATUT_Soumise,
            'details' => $details,
            'date_publication' => $validated['date_publication'] ?? $validated['date_annonce'] ?? now(),
            'date_expiration' => $validated['date_expiration'] ?? null,
            'membre_id' => $membre->id,
            'classe_id' => $membre->classe_id,
            'family_id' => $user->family_id,
            'created_by' => $user->id,
            'est_annonce' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Annonce soumise avec succès.',
            'annonce' => $annonce,
        ]);
    }

    public function fiche(int $id)
    {
        $user = Auth::user();
        $acte = ActeLiturgique::with(['createur', 'family', 'conducteur', 'pasteur', 'membre'])
            ->annonces()
            ->findOrFail($id);

        if ((int) $acte->created_by !== (int) $user->id && (int) $acte->family_id !== (int) $user->family_id) {
            abort(403, 'Vous n\'avez pas accès à cette annonce.');
        }

        if (!in_array($acte->statut, ['VALIDEE', 'PUBLIEE', 'ARCHIVEE'], true) || !$acte->pasteur_id) {
            abort(403, 'La fiche PDF est disponible uniquement après validation du pasteur.');
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.fiche-demande', ['acte' => $acte])
            ->setPaper('a4', 'portrait');

        $prefix = $acte->type_acte === 'priere' ? 'Priere' : 'Annonce';
        return $pdf->download("{$prefix}_{$acte->reference}.pdf");
    }
}
