<?php

namespace App\Http\Controllers\ResponsableFamille\Sondage;

use App\Http\Controllers\Controller;
use App\Models\Sondage;
use App\Models\SondageReponse;
use App\Services\SondageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SondageController extends Controller
{
    public function __construct(
        private readonly SondageService $sondageService,
    ) {
    }

    public function index(): Response
    {
        $user = Auth::user();

        return Inertia::render('ResponsableFamille/Sondage/Index', [
            'sondages' => $user
                ? $this->sondageService->getVisibleSondagesForUser($user)
                : [],
            'authUser' => [
                'id' => $user?->id,
                'nom' => $user?->nom,
                'prenom' => $user?->prenom,
                'classe_id' => $user?->classe_id,
            ],
            'classe' => [
                'id' => $user?->classe?->id,
                'nom' => $user?->classe?->nom,
            ],
        ]);
    }

    public function show(int $id): Response
    {
        $user = Auth::user();
        abort_unless($user, 403);

        $survey = $this->sondageService->findVisibleSondageForUser($user, $id);
        abort_unless($survey, 404);

        return Inertia::render('ResponsableFamille/Sondage/Show', [
            'survey' => $survey,
            'classe' => [
                'id' => $user->classe?->id,
                'nom' => $user->classe?->nom,
            ],
            'hasResponded' => (bool) ($survey['aDejaRepondu'] ?? false),
        ]);
    }

    public function storeResponse(Request $request, int $id): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user, 403);

        $survey = Sondage::query()
            ->with('classe')
            ->findOrFail($id);

        abort_unless((int) $survey->classe_id === (int) $user->classe_id, 403);
        $visibleSurvey = $this->sondageService->findVisibleSondageForUser($user, $id);
        abort_unless($visibleSurvey, 403);

        if (($visibleSurvey['statut'] ?? null) === 'Cloture') {
            return redirect()
                ->route('responsable_famille.sondages.show', $id)
                ->withErrors([
                    'survey' => 'Ce sondage est expire. Vous ne pouvez plus repondre.',
                ]);
        }

        if ($this->sondageService->hasUserResponded($id, $user)) {
            return redirect()
                ->route('responsable_famille.sondages.show', $id)
                ->withErrors([
                    'survey' => 'Vous avez deja repondu a ce sondage.',
                ]);
        }

        $answers = $request->input('answers', []);
        $this->validateAnswers($survey->questions ?? [], $answers);

        SondageReponse::create([
            'sondage_id' => $survey->id,
            'respondent_key' => $this->sondageService->makeRespondentKey(
                $survey->id,
                $user,
            ),
            'respondent_profile' => $this->sondageService->buildAnonymousProfileSnapshot($user),
            'reponses' => $answers,
            'submitted_at' => now(),
        ]);

        return redirect()
            ->route('responsable_famille.sondages.show', $id)
            ->with('success', 'Votre reponse anonyme a ete enregistree.');
    }

    private function validateAnswers(array $questions, array $answers): void
    {
        foreach ($questions as $index => $question) {
            $questionId = $question['id'] ?? null;

            if (!$questionId) {
                continue;
            }

            $value = $answers[$questionId] ?? null;
            $required = (bool) ($question['required'] ?? false);
            $type = $question['type'] ?? 'text';

            if ($required && ($value === null || $value === '' || $value === [])) {
                throw ValidationException::withMessages([
                    'answers' => "La question " . ($index + 1) . " est obligatoire.",
                ]);
            }

            if ($value === null || $value === '') {
                continue;
            }

            if ($type === 'multiple' && !is_array($value)) {
                throw ValidationException::withMessages([
                    'answers' => "La question " . ($index + 1) . " attend plusieurs choix.",
                ]);
            }

            if ($type !== 'multiple' && is_array($value)) {
                throw ValidationException::withMessages([
                    'answers' => "La question " . ($index + 1) . " attend une seule reponse.",
                ]);
            }
        }
    }
}
