<?php

namespace App\Http\Controllers\MembreFamille;

use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FlashAnnonceController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'titre'           => 'required|string|max:255',
            'contenu'         => 'required|string|max:2000',
            'date_expiration' => 'nullable|date|after:now',
        ], [
            'titre.required'   => 'Le titre est obligatoire.',
            'contenu.required' => 'Le contenu est obligatoire.',
        ]);

        $user      = Auth::user();
        $reference = 'MF-' . strtoupper(uniqid());

        $acte = ActeLiturgique::create([
            'reference'        => $reference,
            'type_acte'        => 'generale',
            'statut'           => ActeLiturgique::STATUT_Soumise,
            'details'          => [
                'titre'   => $validated['titre'],
                'contenu' => $validated['contenu'],
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
