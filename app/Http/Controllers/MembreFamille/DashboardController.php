<?php

namespace App\Http\Controllers\MembreFamille;

use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use App\Models\Priere;
use App\Services\SondageService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        private readonly SondageService $sondageService,
    ) {
    }

    public function index()
    {
        $user = Auth::user();
        $user->loadMissing('family', 'classe');
        $surveyBadgeCount = $user
            ? $this->sondageService
                ->getVisibleSondagesForUser($user)
                ->filter(fn (array $survey) => ($survey['statut'] ?? null) === 'Actif' && !($survey['aDejaRepondu'] ?? false))
                ->count()
            : 0;
        $prayerBadgeCount = $user
            ? Priere::query()
                ->where('user_id', $user->id)
                ->where(function ($query) {
                    $query->whereIn('statut', ['Transmise', 'En priere', 'Exaucement partage'])
                        ->orWhereNotNull('vue_le')
                        ->orWhereNotNull('prise_en_priere_le')
                        ->orWhereNotNull('exaucee_le');
                })
                ->count()
            : 0;

        return Inertia::render('MembreFamille/Dashboard', [
            'role' => $user->role,
            'surveyBadgeCount' => $surveyBadgeCount,
            'prayerBadgeCount' => $prayerBadgeCount,
            'familyName' => $user->family?->nom,
            'classeLabel' => $user->classe?->nom,
            'flashAnnouncements' => ActeLiturgique::query()
                ->where('est_annonce', true)
                ->whereNotNull('pasteur_id')
                ->whereIn('statut', [ActeLiturgique::STATUT_VALIDEE, ActeLiturgique::STATUT_PUBLIEE])
                ->orderByDesc('date_publication')
                ->orderByDesc('updated_at')
                ->limit(12)
                ->get()
                ->map(function (ActeLiturgique $annonce) {
                    $text = trim((string) ($annonce->details['contenu'] ?? $annonce->message ?? ''));

                    if ($text === '') {
                        $text = 'Annonce paroissiale publiee.';
                    }

                    return [
                        'id' => $annonce->id,
                        'text' => $text,
                    ];
                })
                ->values(),
        ]);
    }
}
