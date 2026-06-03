<?php

namespace App\Http\Controllers\Pasteur\Sondage;

use App\Http\Controllers\Controller;
use App\Models\Sondage;
use App\Models\SondageView;
use App\Services\SondageService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Str;

class SondageController extends Controller
{
    public function __construct(
        private readonly SondageService $sondageService,
    ) {
    }

    public function index(): Response
    {
        return Inertia::render('Pasteur/Sondage/Index', [
            'sondages' => $this->sondageService->getAllSondages(),
            'seenSurveyIds' => SondageView::query()
                ->where('user_id', Auth::id())
                ->pluck('sondage_id')
                ->all(),
        ]);
    }

    public function show(int $id): Response
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

        return Inertia::render('Pasteur/Sondage/Show', array_merge(
            $this->sondageService->buildSurveyAnalyticsPayload($survey, $participantCount),
            [
                'exportUrl' => route('pasteur.sondages.export', $survey->id),
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
            'scopeLabel' => 'Pasteur',
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
