<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use App\Models\Family;
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

        // Récupérer la famille du responsable avec ses relations
        $family = Family::where('responsable_id', $user->id)
            ->with('classe', 'ville')
            ->first();

        // Statistiques de la famille
        $familyStats = [];
        $familyData = null;

        $validatedActesCount = 0;
        if ($family) {
            $members = $family->users()->get();
            $memberIds = $members->pluck('id');
            $validatedActesCount = ActeLiturgique::where(function ($query) use ($user, $memberIds) {
                $query->where('created_by', $user->id)
                    ->orWhereIn('membre_id', $memberIds);
            })
                ->whereIn('statut', ['VALIDEE', 'PUBLIEE', 'ARCHIVEE'])
                ->count();

            $familyStats = [
                'totalMembers' => $members->count(),
                'maleMembers' => $members->filter(function ($m) {
                    return $m->genre === 'M';
                })->count(),
                'femaleMembers' => $members->filter(function ($m) {
                    return $m->genre === 'F';
                })->count(),
                'familyName' => $family->nom,
                'className' => $family->classe?->nom ?? 'N/A',
                'familyId' => $family->id,
            ];

            // Données complètes de la famille
            $familyData = [
                'id' => $family->id,
                'nom' => $family->nom,
                'email' => $family->email,
                'telephone' => $family->telephone,
                'adresse' => $family->adresse,
                'ville_name' => $family->ville?->nom ?? 'N/A',
                'classe_name' => $family->classe?->nom ?? 'N/A',
                'quartier' => $family->quartier,
            ];
        }

        $flashInfoBadgeCount = ActeLiturgique::where('created_by', $user->id)
            ->where('est_annonce', true)
            ->whereNull('family_id')
            ->where('statut', ActeLiturgique::STATUT_PUBLIEE)
            ->where('vu_par_demandeur', false)
            ->count();

        $surveyBadgeCount = $this->sondageService
            ->getVisibleSondagesForUser($user)
            ->filter(fn (array $survey) => ($survey['statut'] ?? null) === 'Actif' && !($survey['aDejaRepondu'] ?? false))
            ->count();
        $prayerBadgeCount = Priere::query()
            ->where('user_id', $user->id)
            ->where(function ($query) {
                $query->whereIn('statut', ['Transmise', 'En priere', 'Exaucement partage'])
                    ->orWhereNotNull('vue_le')
                    ->orWhereNotNull('prise_en_priere_le')
                    ->orWhereNotNull('exaucee_le');
            })
            ->count();

        return Inertia::render('ResponsableFamille/Dashboard', [
            'role' => $user->role,
            'familyStats' => $familyStats,
            'familyData' => $familyData,
            'validatedActesCount' => $validatedActesCount,
            'flashInfoBadgeCount' => $flashInfoBadgeCount,
            'surveyBadgeCount' => $surveyBadgeCount,
            'prayerBadgeCount' => $prayerBadgeCount,
            'flashAnnouncements' => $this->buildFlashAnnouncements(),
        ]);
    }

    private function buildFlashAnnouncements()
    {
        return ActeLiturgique::query()
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
            ->values();
    }
}
