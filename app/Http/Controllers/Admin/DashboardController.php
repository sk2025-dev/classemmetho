<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inscription;
use App\Models\Priere;
use App\Models\PriereView;
use App\Models\Sondage;
use App\Models\SondageView;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $user?->loadMissing('family', 'classe');

        // Compter les inscriptions en attente
        $pendingInscriptions = Inscription::where('status', 'en_attente')->count();

        return Inertia::render('Admin/Dashboard', [
            'role' => $user->role,
            'pendingInscriptions' => $pendingInscriptions,
            'surveyBadgeCount' => Sondage::query()
                ->where('statut', 'active')
                ->whereNotIn(
                    'id',
                    SondageView::query()
                        ->where('user_id', $user->id)
                        ->select('sondage_id'),
                )
                ->count(),
            'prayerBadgeCount' => Priere::query()
                ->whereNotIn(
                    'id',
                    PriereView::query()
                        ->where('user_id', $user->id)
                        ->select('priere_id'),
                )
                ->count(),
            'familyName' => $user->family?->nom,
            'classeLabel' => $user->classe?->nom,
        ]);
    }
}
