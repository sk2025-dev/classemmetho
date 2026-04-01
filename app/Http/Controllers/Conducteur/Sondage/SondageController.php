<?php

namespace App\Http\Controllers\Conducteur\Sondage;

use App\Http\Controllers\Controller;
use App\Models\Sondage;
use App\Models\SondageReponse;
use App\Services\SondageService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
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

        return Inertia::render('Conducteur/Sondage/Index', [
            'sondages' => $this->sondageService->getClasseSondages($user?->classe_id),
            'authUser' => [
                'id' => $user?->id,
                'nom' => $user?->nom,
                'prenom' => $user?->prenom,
                'classe_id' => $user?->classe_id,
            ],
        ]);
    }

    public function create(): Response
    {
        $user = Auth::user();

        return Inertia::render('Conducteur/Sondage/Create', [
            'mode' => 'create',
            'existingSurvey' => null,
            'authUser' => [
                'id' => $user?->id,
                'nom' => $user?->nom,
                'prenom' => $user?->prenom,
                'classe_id' => $user?->classe_id,
            ],
        ]);
    }

    public function edit(int $id): Response
    {
        $user = Auth::user();
        abort_unless($user?->classe_id, 403, 'Aucune classe associee a cet utilisateur.');

        $survey = $this->findEditableSurvey($user->classe_id, $id);

        return Inertia::render('Conducteur/Sondage/Create', [
            'mode' => 'edit',
            'existingSurvey' => $this->buildEditableSurveyPayload($survey),
            'authUser' => [
                'id' => $user?->id,
                'nom' => $user?->nom,
                'prenom' => $user?->prenom,
                'classe_id' => $user?->classe_id,
            ],
        ]);
    }

    public function show(int $id): Response
    {
        $user = Auth::user();
        abort_unless($user?->classe_id, 403, 'Aucune classe associee a cet utilisateur.');

        [$survey, $participantCount] = $this->resolveSurveyAnalyticsContext($user->classe_id, $id);
        return Inertia::render('Conducteur/Sondage/Show', array_merge(
            $this->sondageService->buildSurveyAnalyticsPayload($survey, $participantCount),
            [
                'exportUrl' => route('conducteur.sondages.export', $survey->id),
                'authUser' => [
                    'id' => $user?->id,
                    'nom' => $user?->nom,
                    'prenom' => $user?->prenom,
                    'classe_id' => $user?->classe_id,
                ],
            ],
        ));
    }

    public function export(int $id)
    {
        $user = Auth::user();
        abort_unless($user?->classe_id, 403, 'Aucune classe associee a cet utilisateur.');

        [$survey, $participantCount] = $this->resolveSurveyAnalyticsContext($user->classe_id, $id);
        $payload = $this->sondageService->buildSurveyAnalyticsPayload($survey, $participantCount);

        $pdf = Pdf::loadView('pdf.sondage-rapport', [
            'survey' => $payload['survey'],
            'responseStats' => $payload['responseStats'] ?? [],
            'profileStats' => $payload['profileStats'] ?? [],
            'generatedAt' => now(),
            'scopeLabel' => 'Conducteur',
        ]);

        return $pdf->download('rapport-sondage-' . Str::slug((string) ($survey->titre ?: 'sondage')) . '.pdf');
    }

    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();

        abort_unless($user?->classe_id, 403, 'Aucune classe associee a cet utilisateur.');

        $validated = $this->validateSurveyPayload($request);
        $surveyId = isset($validated['surveyId']) ? (int) $validated['surveyId'] : null;

        if ($surveyId) {
            return $this->update($request, $surveyId);
        }

        $mode = $validated['mode'] ?? 'publish';

        $survey = Sondage::create([
            'code' => null,
            'classe_id' => $user->classe_id,
            'created_by' => $user->id,
            'titre' => $validated['titre'],
            'description' => $validated['description'] ?? null,
            'objectif' => $validated['objectif'] ?? null,
            'audience' => $validated['audience'],
            'date_echeance' => $validated['dateEcheance'] ?? null,
            'anonymat' => true,
            'message_fin' => $validated['messageFin'] ?? null,
            'diffusion' => $validated['diffusion'] ?? 'Lien partage',
            'questions' => $validated['questions'],
            'statut' => $mode === 'draft' ? 'draft' : 'active',
            'published_at' => $mode === 'draft' ? null : now(),
        ]);

        $this->sondageService->ensureUniqueSurveyCode($survey);

        if (($validated['diffusion'] ?? 'Lien partage') === 'Lien partage') {
            $this->sondageService->ensurePublicToken($survey);
        }

        return redirect()
            ->route('conducteur.sondages.index')
            ->with('success', $mode === 'draft'
                ? 'Le brouillon du sondage a ete enregistre.'
                : 'Le sondage a ete publie pour votre classe.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user?->classe_id, 403, 'Aucune classe associee a cet utilisateur.');

        $survey = $this->findEditableSurvey($user->classe_id, $id);
        $validated = $this->validateSurveyPayload($request);
        $mode = $validated['mode'] ?? ($survey->statut === 'draft' ? 'draft' : 'publish');

        $survey->update([
            'titre' => $validated['titre'],
            'description' => $validated['description'] ?? null,
            'objectif' => $validated['objectif'] ?? null,
            'audience' => $validated['audience'],
            'date_echeance' => $validated['dateEcheance'] ?? null,
            'message_fin' => $validated['messageFin'] ?? null,
            'diffusion' => $validated['diffusion'] ?? 'Lien partage',
            'questions' => $validated['questions'],
            'statut' => $mode === 'draft' ? 'draft' : 'active',
            'published_at' => $mode === 'draft'
                ? $survey->published_at
                : ($survey->published_at ?? now()),
        ]);

        $this->sondageService->ensureUniqueSurveyCode($survey->fresh());

        if (($validated['diffusion'] ?? 'Lien partage') === 'Lien partage') {
            $this->sondageService->ensurePublicToken($survey->fresh());
        }

        return redirect()
            ->route('conducteur.sondages.index')
            ->with('success', $mode === 'draft'
                ? 'Le brouillon du sondage a ete mis a jour.'
                : 'Le sondage a ete mis a jour.');
    }

    public function publish(int $id): RedirectResponse
    {
        $user = Auth::user();
        abort_unless($user?->classe_id, 403, 'Aucune classe associee a cet utilisateur.');

        $survey = $this->findEditableSurvey($user->classe_id, $id);
        abort_unless($survey->statut === 'draft', 403, 'Seul un brouillon peut etre publie.');

        if (!$this->isSurveyReadyForPublication($survey)) {
            return redirect()
                ->route('conducteur.sondages.index')
                ->with('error', 'Le brouillon est incomplet. Completez les champs essentiels avant publication.');
        }

        $survey->update([
            'statut' => 'active',
            'published_at' => $survey->published_at ?? now(),
        ]);

        $this->sondageService->ensureUniqueSurveyCode($survey->fresh());

        if (trim((string) $survey->diffusion) === 'Lien partage') {
            $this->sondageService->ensurePublicToken($survey->fresh());
        }

        return redirect()
            ->route('conducteur.sondages.index')
            ->with('success', 'Le sondage a ete publie pour votre classe.');
    }

    public function preview(string $id = 'new'): Response
    {
        $user = Auth::user();

        return Inertia::render('Conducteur/Sondage/Preview', [
            'surveyId' => $id,
            'authUser' => [
                'id' => $user?->id,
                'nom' => $user?->nom,
                'prenom' => $user?->prenom,
                'classe_id' => $user?->classe_id,
            ],
        ]);
    }

    public function respond(int $id): Response
    {
        $user = Auth::user();
        abort_unless($user, 403);

        $survey = $this->sondageService->findVisibleSondageForUser($user, $id);
        abort_unless($survey, 404);

        return Inertia::render('Conducteur/Sondage/Respond', [
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
                ->route('conducteur.sondages.respond', $id)
                ->withErrors([
                    'survey' => 'Ce sondage est expire. Vous ne pouvez plus repondre.',
                ]);
        }

        if ($this->sondageService->hasUserResponded($id, $user)) {
            return redirect()
                ->route('conducteur.sondages.respond', $id)
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
            ->route('conducteur.sondages.respond', $id)
            ->with('success', 'Votre reponse anonyme a ete enregistree.');
    }

    private function buildResponseStats(array $questions, Collection $responses): array
    {
        return collect($questions)
            ->values()
            ->map(function (array $question, int $index) use ($responses) {
                $questionId = $question['id'] ?? null;
                $questionType = $question['type'] ?? 'text';
                $options = collect($question['options'] ?? [])
                    ->filter(fn ($option) => $option !== null && $option !== '')
                    ->values();

                $answerValues = $responses
                    ->map(fn (SondageReponse $response) => $questionId ? ($response->reponses[$questionId] ?? null) : null)
                    ->filter(fn ($value) => !($value === null || $value === '' || $value === []))
                    ->values();

                $optionStats = collect();

                if (in_array($questionType, ['multiple', 'yes_no', 'rating'], true)) {
                    $optionStats = $options->map(function ($option) use ($answerValues) {
                        $count = $answerValues->filter(fn ($value) => $value === $option)->count();
                        $total = $answerValues->count();

                        return [
                            'label' => $option,
                            'count' => $count,
                            'percentage' => $total > 0 ? (int) round(($count / $total) * 100) : 0,
                        ];
                    });
                }

                if ($questionType === 'checkbox') {
                    $optionStats = $options->map(function ($option) use ($answerValues) {
                        $count = $answerValues
                            ->filter(fn ($value) => is_array($value) && in_array($option, $value, true))
                            ->count();
                        $total = $answerValues->count();

                        return [
                            'label' => $option,
                            'count' => $count,
                            'percentage' => $total > 0 ? (int) round(($count / $total) * 100) : 0,
                        ];
                    });
                }

                $textAnswers = $answerValues
                    ->map(function ($value) {
                        if (is_array($value)) {
                            return implode(', ', $value);
                        }

                        return (string) $value;
                    })
                    ->filter(fn (string $value) => trim($value) !== '')
                    ->values();

                return [
                    'id' => $questionId ?: 'question-' . $index,
                    'title' => $question['title'] ?? 'Question sans titre',
                    'type' => $questionType,
                    'required' => (bool) ($question['required'] ?? false),
                    'options' => $options->values(),
                    'answersCount' => $answerValues->count(),
                    'optionStats' => $optionStats->values(),
                    'textAnswers' => $textAnswers,
                ];
            })
            ->all();
    }

    private function buildProfileStats(Collection $responses): array
    {
        return [
            [
                'key' => 'genre',
                'title' => 'Repartition par genre',
                'subtitle' => 'Vue anonyme des repondants selon le genre renseigne sur leur compte.',
                'items' => $this->aggregateProfileDistribution($responses, 'genre'),
            ],
            [
                'key' => 'role',
                'title' => 'Repartition par role',
                'subtitle' => 'Lecture des participations selon le role de chaque repondant.',
                'items' => $this->aggregateProfileDistribution($responses, 'role'),
            ],
            [
                'key' => 'employment_status',
                'title' => 'Repartition socio-pro',
                'subtitle' => 'Situation socio-professionnelle des repondants, sans information nominative.',
                'items' => $this->aggregateProfileDistribution($responses, 'employment_status'),
            ],
        ];
    }

    private function aggregateProfileDistribution(Collection $responses, string $key): array
    {
        $counts = $responses
            ->map(function (SondageReponse $response) use ($key) {
                $profile = $response->respondent_profile ?? [];
                $value = trim((string) data_get($profile, $key, ''));

                return $value !== '' ? $value : match ($key) {
                    'role' => 'Autres',
                    'employment_status' => 'Non renseignee',
                    default => 'Non renseigne',
                };
            })
            ->countBy();

        $total = max(1, $counts->sum());
        $palette = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#0f766e'];

        return $counts
            ->sortDesc()
            ->map(fn ($count, $label) => [
                'label' => $label,
                'count' => (int) $count,
                'percentage' => (int) round((((int) $count) / $total) * 100),
            ])
            ->values()
            ->map(function (array $item, int $index) use ($palette) {
                $item['color'] = $palette[$index % count($palette)];

                return $item;
            })
            ->all();
    }

    private function validateSurveyPayload(Request $request): array
    {
        $user = Auth::user();
        $surveyId = $request->input('surveyId');

        return $request->validate([
            'surveyId' => ['nullable', 'integer'],
            'titre' => [
                'required',
                'string',
                'max:255',
                Rule::unique('sondages', 'titre')
                    ->where(fn ($query) => $query->where('classe_id', $user?->classe_id))
                    ->ignore($surveyId),
            ],
            'description' => ['nullable', 'string'],
            'objectif' => ['nullable', 'string'],
            'audience' => ['required', 'string', 'max:255'],
            'dateEcheance' => ['nullable', 'date'],
            'messageFin' => ['nullable', 'string'],
            'diffusion' => ['nullable', 'string', 'max:255'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.id' => ['nullable', 'string', 'max:255'],
            'questions.*.type' => ['required', 'string', 'max:50'],
            'questions.*.title' => ['required', 'string'],
            'questions.*.required' => ['nullable', 'boolean'],
            'questions.*.options' => ['nullable', 'array'],
            'questions.*.options.*' => ['nullable', 'string'],
            'mode' => ['nullable', 'in:draft,publish'],
        ]);
    }

    private function findEditableSurvey(int $classeId, int $id): Sondage
    {
        $survey = Sondage::query()
            ->withCount('responses')
            ->where('classe_id', $classeId)
            ->findOrFail($id);

        abort_unless(
            $survey->statut === 'draft' || (int) ($survey->responses_count ?? 0) === 0,
            403,
            'Ce sondage ne peut plus etre modifie.',
        );

        return $survey;
    }

    private function buildEditableSurveyPayload(Sondage $survey): array
    {
        return [
            'id' => $survey->id,
            'code' => $survey->code,
            'titre' => $survey->titre,
            'description' => $survey->description,
            'objectif' => $survey->objectif,
            'audience' => $survey->audience,
            'dateEcheance' => optional($survey->date_echeance)?->format('Y-m-d'),
            'messageFin' => $survey->message_fin,
            'diffusion' => $survey->diffusion,
            'questions' => $survey->questions ?? [],
            'statut' => $survey->statut,
            'responseCount' => (int) ($survey->responses_count ?? 0),
        ];
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
                    'answers' => 'La question ' . ($index + 1) . ' est obligatoire.',
                ]);
            }

            if ($value === null || $value === '') {
                continue;
            }

            if ($type === 'multiple' && !is_array($value)) {
                throw ValidationException::withMessages([
                    'answers' => 'La question ' . ($index + 1) . ' attend plusieurs choix.',
                ]);
            }

            if ($type !== 'multiple' && is_array($value)) {
                throw ValidationException::withMessages([
                    'answers' => 'La question ' . ($index + 1) . ' attend une seule reponse.',
                ]);
            }
        }
    }

    private function resolveStatut(Sondage $sondage): string
    {
        if ($sondage->statut === 'draft') {
            return 'Brouillon';
        }

        if ($sondage->statut === 'closed') {
            return 'Cloture';
        }

        if ($sondage->date_echeance instanceof Carbon && $sondage->date_echeance->isPast()) {
            return 'Cloture';
        }

        return 'Actif';
    }

    private function isSurveyReadyForPublication(Sondage $survey): bool
    {
        if (trim((string) $survey->titre) === '' || trim((string) $survey->audience) === '') {
            return false;
        }

        $questions = collect($survey->questions ?? []);

        if ($questions->isEmpty()) {
            return false;
        }

        return $questions->every(function ($question) {
            $title = trim((string) ($question['title'] ?? ''));
            $type = trim((string) ($question['type'] ?? 'text'));
            $options = collect($question['options'] ?? [])
                ->map(fn ($option) => trim((string) $option))
                ->filter()
                ->values();

            if ($title === '') {
                return false;
            }

            if ($type === 'text') {
                return true;
            }

            return $options->isNotEmpty();
        });
    }

    private function resolveSurveyAnalyticsContext(int $classeId, int $id): array
    {
        $survey = Sondage::query()
            ->with([
                'createur:id,nom,prenom',
                'classe:id,nom',
                'responses' => fn ($query) => $query->latest('submitted_at')->latest(),
            ])
            ->where('classe_id', $classeId)
            ->findOrFail($id);

        if (trim((string) $survey->diffusion) === 'Lien partage' && $survey->statut !== 'draft') {
            $this->sondageService->ensurePublicToken($survey);
            $survey->refresh();
        }

        $participantCount = (int) ($this->sondageService
            ->getClasseSondages($classeId)
            ->firstWhere('id', $survey->id)['participants'] ?? 0);

        return [$survey, $participantCount];
    }
}
