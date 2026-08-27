<?php

namespace App\Http\Controllers\PresidentConducteurs;

use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use App\Models\ActeLiturgiqueHistorique;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AnnonceController extends Controller
{
    /**
     * Le président des conducteurs soumet sa propre demande de prière /
     * action de grâce. Il occupe déjà l'étape "Bureau des Conducteurs" du
     * circuit : la demande part donc directement vers le pasteur.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type_annonce'      => 'required|string',
            'motif'             => 'nullable|string|max:100',
            'temoignage_public' => 'nullable|boolean',
            'membre_id'         => 'nullable|exists:users,id',
            'message'           => 'nullable|string',
            'date_annonce'      => 'nullable|date',
            'heure_culte'       => 'nullable|string|max:10',
        ]);

        $user = Auth::user();
        $membre = null;
        if (!empty($validated['membre_id'])) {
            $membre = User::findOrFail($validated['membre_id']);
        }

        $type = $validated['type_annonce'] ?? 'generale';
        $details = [
            'titre'             => $validated['message'] ?? '',
            'contenu'           => $validated['message'] ?? '',
            'motif'             => $validated['motif'] ?? null,
            'temoignage_public' => $validated['temoignage_public'] ?? false,
            'heure_culte'       => $validated['heure_culte'] ?? null,
        ];
        $reference = 'ANN-' . strtoupper(uniqid());

        $acte = ActeLiturgique::create([
            'reference'            => $reference,
            'type_acte'            => $type,
            'statut'               => ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR,
            'details'              => $details,
            'date_souhaitee'       => $validated['date_annonce'] ?? now(),
            'date_publication'     => now(),
            'membre_id'            => $validated['membre_id'] ?? null,
            'classe_id'            => $membre?->classe_id ?? null,
            'created_by'           => $user->id,
            'bureau_conducteur_id' => $user->id,
            'est_annonce'          => true,
        ]);

        // Le président occupe déjà les étapes "Conducteur" et "Bureau" : on
        // trace ces validations implicites pour que la chronologie les affiche.
        ActeLiturgiqueHistorique::create([
            'acte_id'          => $acte->id,
            'statut_precedent' => ActeLiturgique::STATUT_Soumise,
            'statut_nouveau'   => ActeLiturgique::STATUT_TRANSMISE_AU_BUREAU_CONDUCTEUR,
            'acteur_id'        => $user->id,
            'commentaire'      => 'Demande soumise directement par le président des conducteurs.',
        ]);
        ActeLiturgiqueHistorique::create([
            'acte_id'          => $acte->id,
            'statut_precedent' => ActeLiturgique::STATUT_TRANSMISE_AU_BUREAU_CONDUCTEUR,
            'statut_nouveau'   => ActeLiturgique::STATUT_TRANSMISE_AU_PASTEUR,
            'acteur_id'        => $user->id,
            'commentaire'      => 'Demande soumise directement par le président des conducteurs.',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Demande de prière créée avec succès.',
            'annonce' => $acte,
        ]);
    }
}
