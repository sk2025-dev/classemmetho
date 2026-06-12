<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FlashAnnonceController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        ActeLiturgique::where('created_by', $user->id)
            ->where('est_annonce', true)
            ->whereNull('family_id')
            ->where('statut', ActeLiturgique::STATUT_PUBLIEE)
            ->where('vu_par_demandeur', false)
            ->update(['vu_par_demandeur' => true]);

        $annonces = ActeLiturgique::annonces()
            ->whereNull('family_id')
            ->where('created_by', $user->id)
            ->whereIn('type_acte', ['generale', 'flash_info'])
            ->latest()
            ->get(['id', 'reference', 'statut', 'details', 'date_publication', 'date_expiration', 'created_at']);

        return Inertia::render('ResponsableFamille/FlashAnnonce', [
            'annonces' => $annonces,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type_demande'    => 'nullable|string|max:50',
            'titre'           => 'required|string|max:255',
            'contenu'         => 'required|string|max:2000',
            'date_expiration' => 'nullable|date|after:now',
            'heure_culte'     => 'nullable|string|max:10',
        ], [
            'titre.required'   => 'Le titre est obligatoire.',
            'contenu.required' => 'Le contenu est obligatoire.',
        ]);

        $user      = Auth::user();
        $reference = 'RF-' . strtoupper(uniqid());

        $acte = ActeLiturgique::create([
            'reference'        => $reference,
            'type_acte'        => 'generale',
            'statut'           => ActeLiturgique::STATUT_Soumise,
            'details'          => [
                'type_demande' => $validated['type_demande'] ?? null,
                'titre'        => $validated['titre'],
                'contenu'      => $validated['contenu'],
                'heure_culte'  => $validated['heure_culte'] ?? null,
            ],
            'date_souhaitee'   => now(),
            'date_publication' => null,
            'date_expiration'  => $validated['date_expiration'] ?? null,
            'created_by'       => $user->id,
            'est_annonce'      => true,
            'family_id'        => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Annonce soumise. Elle sera publiée après validation par l\'administrateur.',
            'annonce' => $acte->fresh(),
        ]);
    }
}
