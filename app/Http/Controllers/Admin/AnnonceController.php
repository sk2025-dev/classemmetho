<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AnnonceController extends Controller
{
    public function index()
    {
        $publiees = ActeLiturgique::with(['createur', 'publieePar'])
            ->annonces()
            ->whereNull('family_id')
            ->where('statut', ActeLiturgique::STATUT_PUBLIEE)
            ->orderBy('date_publication', 'desc')
            ->get();

        $archivees = ActeLiturgique::with(['createur'])
            ->annonces()
            ->whereNull('family_id')
            ->where('statut', ActeLiturgique::STATUT_ARCHIVEE)
            ->orderBy('updated_at', 'desc')
            ->limit(20)
            ->get();

        return Inertia::render('Admin/Annonces', [
            'publiees' => $publiees,
            'archivees' => $archivees,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'titre'          => 'required|string|max:255',
            'contenu'        => 'required|string|max:2000',
            'date_expiration'=> 'nullable|date|after:now',
        ], [
            'titre.required'   => 'Le titre est obligatoire.',
            'contenu.required' => 'Le contenu est obligatoire.',
            'date_expiration.after' => 'La date d\'expiration doit être dans le futur.',
        ]);

        $user      = Auth::user();
        $reference = 'ADM-' . strtoupper(uniqid());

        $acte = ActeLiturgique::create([
            'reference'       => $reference,
            'type_acte'       => 'generale',
            'statut'          => ActeLiturgique::STATUT_PUBLIEE,
            'details'         => [
                'titre'   => $validated['titre'],
                'contenu' => $validated['contenu'],
            ],
            'date_souhaitee'  => now(),
            'date_publication'=> now(),
            'date_expiration' => $validated['date_expiration'] ?? null,
            'created_by'      => $user->id,
            'publiee_par'     => $user->id,
            'est_annonce'     => true,
            'family_id'       => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Information publiée dans le flash info.',
            'annonce' => $acte->load(['createur']),
        ]);
    }

    public function archiver(int $id)
    {
        $acte = ActeLiturgique::annonces()
            ->whereNull('family_id')
            ->findOrFail($id);

        $acte->update(['statut' => ActeLiturgique::STATUT_ARCHIVEE]);

        return response()->json([
            'success' => true,
            'message' => 'Information archivée.',
        ]);
    }

    public function destroy(int $id)
    {
        $acte = ActeLiturgique::annonces()
            ->whereNull('family_id')
            ->findOrFail($id);

        $acte->delete();

        return response()->json([
            'success' => true,
            'message' => 'Information supprimée.',
        ]);
    }
}
