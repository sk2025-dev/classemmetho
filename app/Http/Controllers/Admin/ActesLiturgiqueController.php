<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActesLiturgiqueController extends Controller
{
    /**
     * Affiche la liste des actes liturgiques pour l'administration.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        // Charge les actes avec toutes les relations nécessaires
        $actes = ActeLiturgique::with([
            'membre',           // La personne concernée par l'acte (User)
            'membre.family',    // La famille du membre (si relation définie)
            'createur',         // L'utilisateur qui a créé la demande
            'conducteur',       // Le conducteur assigné (User)
            'pasteur',          // Le pasteur assigné (User)
            'classe',           // La classe associée
            'piecesJointes',    // Les pièces jointes
        ])->latest()->get();

        // Transformation des données pour le frontend
        $formattedActes = $actes->map(function ($acte) {
            // Mapper les statuts réels vers ceux attendus par le composant
            $statusMap = [
                'SOUMISE'      => 'pending',
                'EN_ATTENTE'   => 'pending',
                'VALIDEE'      => 'validated',
                'PUBLIEE'      => 'validated',
                'CELEBRE'      => 'validated',
                'TERMINE'      => 'validated',
                'REJETEE'      => 'rejected',
                'ARCHIVEE'     => 'rejected', // ou 'archived' si vous voulez un statut dédié
            ];
            $status = $statusMap[$acte->statut] ?? 'pending';

            // Nom du membre concerné
            $memberName = $acte->membre
                ? trim($acte->membre->prenom . ' ' . $acte->membre->nom)
                : 'Inconnu';

            // Nom de la famille
            $familyName = 'Famille inconnue';
            if ($acte->membre && $acte->membre->family) {
                $familyName = $acte->membre->family->nom; // suppose un champ 'nom' dans la table families
            } elseif ($acte->family) {
                $familyName = $acte->family->nom;
            }

            // Nom de la classe
            $className = $acte->classe?->nom
                ?? $acte->membre?->classe?->nom
                ?? 'Non définie';

            // Nom du conducteur
            $conductorName = $acte->conducteur
                ? trim($acte->conducteur->prenom . ' ' . $acte->conducteur->nom)
                : 'Non assigné';

            // Nom du pasteur
            $pastorName = $acte->pasteur
                ? trim($acte->pasteur->prenom . ' ' . $acte->pasteur->nom)
                : 'Non assigné';

            // Première pièce jointe (nom original)
            $attachment = $acte->piecesJointes->first()?->original_name ?? null;

            // Transformation du type d'acte (optionnel : pour affichage plus lisible)
            $typeLabels = [
                'bapteme'             => 'Baptême',
                'premiere_communion'  => '1ère Communion',
                'confirmation'        => 'Confirmation',
                'mariage'             => 'Mariage',
                'naissance'           => 'Naissance',
                'deces'               => 'Décès',
            ];
            $type = $typeLabels[$acte->type_acte] ?? ucfirst($acte->type_acte);

            return [
                'id'          => $acte->id,
                'type'        => $type,
                'date'        => $acte->date_celebration?->format('Y-m-d') ?? $acte->created_at->format('Y-m-d'),
                'member'      => $memberName,
                'family'      => $familyName,
                'class'       => $className,
                'conductor'   => $conductorName,
                'pastor'      => $pastorName,
                'description' => $acte->details['description'] ?? '',
                'attachment'  => $attachment,
                'status'      => $status,
            ];
        });

        // Retourne la vue Inertia avec les données
        return Inertia::render('Admin/ActesLiturgique', [
            'initialActs' => $formattedActes,
        ]);
    }
}