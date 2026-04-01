<?php

namespace App\Http\Controllers\Admin\Sondage;

use App\Http\Controllers\Controller;
use App\Models\Sondage;
use App\Services\SondageService;
use Barryvdh\DomPDF\Facade\Pdf;
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
        return Inertia::render('Admin/Sondage/Index', [
            'sondages' => $this->sondageService->getAllSondages(),
        ]);
    }

    public function show(int $id): Response
    {
        [$survey, $participantCount] = $this->resolveSurveyAnalyticsContext($id);

        return Inertia::render('Admin/Sondage/Show', array_merge(
            $this->sondageService->buildSurveyAnalyticsPayload($survey, $participantCount),
            [
                'exportUrl' => route('admin.sondages.export', $survey->id),
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
            'scopeLabel' => 'Admin',
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

        $participantCount = (int) ($this->sondageService->getAllSondages()
            ->firstWhere('id', $survey->id)['participants'] ?? 0);

        return [$survey, $participantCount];
    }
}
