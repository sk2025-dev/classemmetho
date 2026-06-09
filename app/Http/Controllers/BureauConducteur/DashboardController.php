<?php

namespace App\Http\Controllers\BureauConducteur;

use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use App\Models\ClassTransferRequest;
use App\Models\Priere;
use App\Models\Sondage;
use App\Models\SondageView;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $familia = $user->family()->with('classe', 'ville')->first();
        $classe  = $user->classe;

        $familyStats = [];
        $familyData  = null;

        if ($familia) {
            $familyStats = [
                'familyName' => $familia->nom,
                'className'  => $classe?->nom ?? $familia->classe?->nom ?? 'N/A',
                'familyId'   => $familia->id,
            ];
            $familyData = [
                'id'         => $familia->id,
                'nom'        => $familia->nom,
                'classe_name'=> $classe?->nom ?? $familia->classe?->nom ?? 'N/A',
            ];
        } elseif ($classe) {
            $familyStats = [
                'familyName' => 'Aucune famille assignée',
                'className'  => $classe->nom,
            ];
            $familyData = ['classe_name' => $classe->nom];
        }

        return Inertia::render('BureauConducteur/Dashboard', [
            'role'                         => $user->role,
            'pendingLiturgieCount'         => ActeLiturgique::query()
                ->where('statut', ActeLiturgique::STATUT_TRANSMISE_AU_BUREAU_CONDUCTEUR)
                ->whereNotIn('type_acte', [
                    ActeLiturgique::TYPE_ANNOUNCE,
                    ActeLiturgique::TYPE_GENERALE,
                ])
                ->count(),
            'surveyBadgeCount'             => Sondage::query()
                ->where('statut', 'active')
                ->whereNotIn('id', SondageView::query()->where('user_id', $user->id)->select('sondage_id'))
                ->count(),
            'prayerBadgeCount'             => Priere::query()->where('statut', 'Nouvelle')->count(),
            'pendingExternalTransfersCount'=> ClassTransferRequest::where('statut', 'EN_ATTENTE_PASTEUR')
                ->where('mode_transfert', 'external')
                ->count(),
            'flashAnnouncements'           => $this->buildFlashAnnouncements(),
            'familyStats'                  => $familyStats,
            'familyData'                   => $familyData,
        ]);
    }

    private function buildFlashAnnouncements(): \Illuminate\Support\Collection
    {
        return ActeLiturgique::query()
            ->where('est_annonce', true)
            ->whereNotNull('pasteur_id')
            ->whereIn('statut', [ActeLiturgique::STATUT_VALIDEE, ActeLiturgique::STATUT_PUBLIEE])
            ->orderByDesc('date_publication')
            ->orderByDesc('updated_at')
            ->limit(12)
            ->get()
            ->map(fn (ActeLiturgique $a) => [
                'id'   => $a->id,
                'text' => trim((string) ($a->details['contenu'] ?? $a->message ?? 'Annonce paroissiale.')),
            ])
            ->values();
    }
}
