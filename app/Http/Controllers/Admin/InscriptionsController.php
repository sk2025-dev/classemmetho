<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inscription;
use Inertia\Inertia;

class InscriptionsController extends Controller
{
    public function index()
    {
        // Récupérer les inscriptions avec pagination (sans data pour éviter les problèmes de mémoire lors du tri)
        $paginated = Inscription::select('id', 'type', 'responsable_nom', 'responsable_prenom', 'responsable_email', 'responsable_tel', 'status', 'ville_id', 'created_at')
            ->orderBy('created_at', 'desc')
            ->paginate(30);

        // Charger les données complètes avec data seulement pour les inscriptions de cette page
        $inscriptions = $paginated->map(function ($inscription) {
            // Recharger l'inscription complète avec le champ data
            $fullInscription = Inscription::find($inscription->id);
            $data = $fullInscription->data ?? [];

            // Déterminer le libellé du type
            $createdByLabel = match($inscription->type) {
                'famille' => 'Famille (Responsable)',
                'individuel' => 'Individuel',
                'pasteur' => 'Pasteur',
                'conducteur' => 'Conducteur',
                default => ucfirst($inscription->type),
            };

            // Extraire la classe depuis le JSON
            $classeId = $data['famille']['classe_id'] ?? null;
            $classe = 'Non assignée';
            if ($classeId) {
                try {
                    $classeModel = \App\Models\Classe::find($classeId);
                    $classe = $classeModel?->nom ?? 'Non assignée';
                } catch (\Exception $e) {
                    $classe = 'Non assignée';
                }
            }

            // Récupérer le nom de la ville
            $villeName = 'N/A';
            if ($fullInscription->ville) {
                $villeName = $fullInscription->ville->nom;
            } elseif (!empty($data['famille']['ville'])) {
                // Fallback: chercher la ville par ID dans les données
                try {
                    $villeModel = \App\Models\Ville::find($data['famille']['ville']);
                    $villeName = $villeModel?->nom ?? 'N/A';
                } catch (\Exception $e) {
                    $villeName = 'N/A';
                }
            }

            return [
                'id' => $inscription->id,
                'type' => $inscription->type ?? 'N/A',
                'created_by' => $createdByLabel,
                'status' => $inscription->status,
                'nom' => $inscription->responsable_nom ?? '',
                'prenom' => $inscription->responsable_prenom ?? '',
                'email' => $inscription->responsable_email ?? '',
                'telephone' => $inscription->responsable_tel ?? '',
                'classe' => $classe,
                'ville' => $villeName,
                'created_at' => $inscription->created_at->format('d/m/Y H:i'),
                'profile_photo_url' => $fullInscription->profile_photo_url, // ✅ Ajouter la photo URL
                'photo_data' => $fullInscription->photo_data, // Garder pour compatibilité
                'data' => $data,
            ];
        });

        return Inertia::render('Admin/Inscriptions', [
            'inscriptions' => $inscriptions,
        ]);
    }

    public function typeSelection()
    {
        return Inertia::render('Admin/InscriptionTypeSelection');
    }
}
