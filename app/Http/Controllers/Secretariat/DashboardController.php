<?php

namespace App\Http\Controllers\Secretariat;

use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Liste les demandes de prière validées par le pasteur (en attente
     * d'archivage/impression par le secrétariat) et l'historique de celles
     * déjà archivées.
     */
    public function index()
    {
        $enAttente = ActeLiturgique::with(['createur', 'membre', 'classe', 'conducteur', 'bureauConducteur'])
            ->annonces()
            ->whereIn('statut', [
                ActeLiturgique::STATUT_VALIDEE,
                ActeLiturgique::STATUT_PUBLIEE,
            ])
            ->orderByDesc('date_publication')
            ->orderByDesc('created_at')
            ->get();

        $archivees = ActeLiturgique::with(['createur', 'membre', 'classe', 'conducteur', 'bureauConducteur'])
            ->annonces()
            ->where('statut', ActeLiturgique::STATUT_ARCHIVEE)
            ->orderByDesc('updated_at')
            ->limit(100)
            ->get();

        return Inertia::render('Secretariat/Dashboard', [
            'enAttente' => $enAttente,
            'archivees' => $archivees,
        ]);
    }
}
