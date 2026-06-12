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
        $publiees = ActeLiturgique::with([
                'createur:id,prenom,nom,role',
                'publieePar:id,prenom,nom,role',
            ])
            ->annonces()
            ->whereNull('family_id')
            ->where('statut', ActeLiturgique::STATUT_PUBLIEE)
            ->orderBy('date_publication', 'desc')
            ->get();

        $archivees = ActeLiturgique::with([
                'createur:id,prenom,nom,role',
                'publieePar:id,prenom,nom,role',
            ])
            ->annonces()
            ->whereNull('family_id')
            ->where('statut', ActeLiturgique::STATUT_ARCHIVEE)
            ->orderBy('updated_at', 'desc')
            ->limit(20)
            ->get();

        // Soumissions en attente de validation admin (conducteurs + responsables de famille)
        $enAttente = ActeLiturgique::with(['createur:id,prenom,nom,role'])
            ->annonces()
            ->whereNull('family_id')
            ->where('statut', ActeLiturgique::STATUT_Soumise)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Admin/Annonces', [
            'publiees'   => $publiees,
            'archivees'  => $archivees,
            'enAttente'  => $enAttente,
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
            'annonce' => $acte->load(['createur:id,prenom,nom,role', 'publieePar:id,prenom,nom,role']),
        ]);
    }

    public function valider(int $id)
    {
        $acte = ActeLiturgique::annonces()
            ->whereNull('family_id')
            ->where('statut', ActeLiturgique::STATUT_Soumise)
            ->findOrFail($id);

        $user = Auth::user();
        $acte->update([
            'statut'           => ActeLiturgique::STATUT_PUBLIEE,
            'date_publication' => now(),
            'publiee_par'      => $user->id,
            'vu_par_demandeur' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Annonce validée et publiée dans le flash info.',
            'annonce' => $acte->load(['createur:id,prenom,nom']),
        ]);
    }

    public function rejeter(int $id)
    {
        $acte = ActeLiturgique::annonces()
            ->whereNull('family_id')
            ->where('statut', ActeLiturgique::STATUT_Soumise)
            ->findOrFail($id);

        $acte->delete();

        return response()->json([
            'success' => true,
            'message' => 'Annonce refusée et supprimée.',
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
