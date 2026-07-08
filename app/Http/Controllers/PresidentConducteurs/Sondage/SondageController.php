<?php

namespace App\Http\Controllers\PresidentConducteurs\Sondage;

use App\Http\Controllers\Controller;
use App\Models\Sondage;
use App\Models\SondageView;
use App\Services\SondageService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class SondageController extends Controller
{
    public function __construct(
        private readonly SondageService $sondageService,
    ) {
    }

    /**
     * Détails analytiques d'un sondage (consommé en JSON par l'onglet Sondages embarqué).
     */
    public function details(int $id)
    {
        SondageView::updateOrCreate(
            [
                'user_id' => Auth::id(),
                'sondage_id' => $id,
            ],
            [
                'viewed_at' => now(),
            ],
        );

        [$survey, $participantCount] = $this->resolveSurveyAnalyticsContext($id);

        return response()->json(array_merge(
            $this->sondageService->buildSurveyAnalyticsPayload($survey, $participantCount),
            [
                'exportUrl' => route('president_conducteurs.sondages.export', $survey->id),
            ],
        ));
    }

    public function export(int $id)
    {
        [$survey, $participantCount] = $this->resolveSurveyAnalyticsContext($id);
        $payload = $this->sondageService->buildSurveyAnalyticsPayload($survey, $participantCount);

        $pdf = Pdf::loadView('pdf.sondage-rapport', [
            'survey' => $payload['survey'],
            'responseStats' => $payload['responseStats'] ?? [],
            'profileStats' => $payload['profileStats'] ?? [],
            'generatedAt' => now(),
            'scopeLabel' => 'Bureau des Conducteurs',
        ]);

        return $pdf->download('rapport-sondage-' . Str::slug((string) ($survey->titre ?: 'sondage')) . '.pdf');
    }

    private function resolveSurveyAnalyticsContext(int $id): array
    {
        $survey = Sondage::query()
            ->with([
                'createur:id,nom,prenom',
                'classe:id,nom',
                'responses' => fn ($query) => $query->latest('submitted_at')->latest(),
            ])
            ->withCount('responses')
            ->findOrFail($id);

        $participantCount = $this->sondageService->resolveParticipantCountForSurvey($survey);

        return [$survey, $participantCount];
    }
}
