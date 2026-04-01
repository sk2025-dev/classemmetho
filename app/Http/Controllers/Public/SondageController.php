<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Sondage;
use App\Models\SondageReponse;
use App\Models\User;
use App\Services\SondageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SondageController extends Controller
{
    private const ACCESS_SESSION_KEY = 'public_sondage_access';

    public function __construct(
        private readonly SondageService $sondageService,
    ) {
    }

    public function show(Request $request, string $token): Response
    {
        $survey = $this->findPublicSurvey($token);
        $member = $this->resolveAuthorizedMember($request, $survey, $token);

        if ($member) {
            return $this->renderRespondPage($request, $survey, $member, $token);
        }

        return Inertia::render('Public/Sondage/Access', [
            'publicToken' => $token,
            'survey' => $this->sondageService->buildPublicSurveyPayload($survey),
            'classe' => [
                'id' => $survey->classe?->id,
                'nom' => $survey->classe?->nom,
            ],
        ]);
    }

    public function verifyAccess(Request $request, string $token): RedirectResponse
    {
        $survey = $this->findPublicSurvey($token);
        $validated = $request->validate([
            'codeFamille' => ['required', 'string', 'max:255'],
            'codeMembre' => ['required', 'string', 'max:255'],
        ]);

        $member = User::query()
            ->with('family:id,code_famille')
            ->whereRaw('UPPER(code_membre) = ?', [mb_strtoupper(trim($validated['codeMembre']))])
            ->whereHas('family', function ($query) use ($validated) {
                $query->whereRaw('UPPER(code_famille) = ?', [mb_strtoupper(trim($validated['codeFamille']))]);
            })
            ->first();

        if (!$member || !$this->memberCanAccessSurvey($member, $survey)) {
            return redirect()
                ->route('sondages.public.show', $token)
                ->withErrors([
                    'access' => "Codes invalides ou membre non autorise pour ce sondage.",
                ]);
        }

        $accessMap = $request->session()->get(self::ACCESS_SESSION_KEY, []);
        $accessMap[$token] = $member->id;
        $request->session()->put(self::ACCESS_SESSION_KEY, $accessMap);

        return redirect()->route('sondages.public.respond', $token);
    }

    public function respond(Request $request, string $token): Response
    {
        $survey = $this->findPublicSurvey($token);
        $member = $this->resolveAuthorizedMember($request, $survey, $token);

        abort_unless($member, 403, 'Acces public non autorise pour ce sondage.');

        return $this->renderRespondPage($request, $survey, $member, $token);
    }

    public function storeResponse(Request $request, string $token): RedirectResponse
    {
        $survey = $this->findPublicSurvey($token);
        $member = $this->resolveAuthorizedMember($request, $survey, $token);

        if (!$member) {
            return redirect()
                ->route('sondages.public.show', $token)
                ->withErrors([
                    'access' => "Veuillez d'abord confirmer le code famille et le code membre.",
                ]);
        }

        if ($this->sondageService->resolvePublicStatus($survey) === 'Cloture') {
            return redirect()
                ->route('sondages.public.respond', $token)
                ->withErrors([
                    'survey' => 'Ce sondage est expire. Vous ne pouvez plus repondre.',
                ]);
        }

        if ($this->sondageService->hasUserResponded($survey->id, $member)) {
            return redirect()
                ->route('sondages.public.respond', $token)
                ->withErrors([
                    'survey' => 'Ce membre a deja repondu a ce sondage.',
                ]);
        }

        $validated = $request->validate([
            'answers' => ['nullable', 'array'],
            'member.nom' => ['required', 'string', 'max:255'],
            'member.prenom' => ['required', 'string', 'max:255'],
            'member.genre' => ['nullable', 'string', 'max:50'],
            'member.email' => ['nullable', 'email', 'max:255'],
            'member.contact' => ['nullable', 'regex:/^\d{1,10}$/'],
            'member.date_naissance' => ['nullable', 'date'],
            'member.employment_status' => ['nullable', 'string', 'max:255'],
            'member.profession_detail' => ['nullable', 'string', 'max:255'],
        ]);

        $answers = $validated['answers'] ?? [];
        $this->validateAnswers($survey->questions ?? [], $answers);

        $memberPayload = $validated['member'] ?? [];
        $member->update([
            'nom' => $memberPayload['nom'] ?? $member->nom,
            'prenom' => $memberPayload['prenom'] ?? $member->prenom,
            'genre' => $memberPayload['genre'] ?? null,
            'email' => $memberPayload['email'] ?? null,
            'telephone' => $memberPayload['contact'] ?? null,
            'date_naissance' => $memberPayload['date_naissance'] ?? null,
            'employment_status' => $memberPayload['employment_status'] ?? null,
            'profession_detail' => $memberPayload['profession_detail'] ?? null,
        ]);
        $member->refresh();

        SondageReponse::create([
            'sondage_id' => $survey->id,
            'respondent_key' => $this->sondageService->makeRespondentKey($survey->id, $member),
            'respondent_profile' => $this->sondageService->buildAnonymousProfileSnapshot($member),
            'reponses' => $answers,
            'submitted_at' => now(),
        ]);

        return redirect()
            ->route('sondages.public.respond', $token)
            ->with('success', 'Votre reponse anonyme a ete enregistree.');
    }

    private function findPublicSurvey(string $token): Sondage
    {
        $survey = Sondage::query()
            ->with([
                'classe:id,nom',
                'createur:id,nom,prenom',
                'responses:id,sondage_id,respondent_profile',
            ])
            ->where('public_token', $token)
            ->firstOrFail();

        abort_unless($this->sondageService->isPubliclyAccessible($survey), 404);

        return $survey;
    }

    private function renderRespondPage(Request $request, Sondage $survey, User $member, string $token): Response
    {
        return Inertia::render('Public/Sondage/Respond', [
            'publicToken' => $token,
            'survey' => $this->sondageService->buildPublicSurveyPayload($survey),
            'classe' => [
                'id' => $survey->classe?->id,
                'nom' => $survey->classe?->nom,
            ],
            'member' => [
                'id' => $member->id,
                'nom' => $member->nom,
                'prenom' => $member->prenom,
                'genre' => $member->genre,
                'role' => $this->sondageService->labelRole($member->role),
                'email' => $member->email,
                'contact' => $member->telephone,
                'date_naissance' => optional($member->date_naissance)?->format('Y-m-d'),
                'employment_status' => $member->employment_status,
                'profession_detail' => $member->profession_detail,
                'profile_photo_url' => $member->profile_photo_url,
                'code_membre' => $member->code_membre,
                'code_famille' => $member->family?->code_famille,
            ],
            'hasResponded' => $this->sondageService->hasUserResponded($survey->id, $member),
        ]);
    }

    private function resolveAuthorizedMember(Request $request, Sondage $survey, string $token): ?User
    {
        $accessMap = $request->session()->get(self::ACCESS_SESSION_KEY, []);
        $memberId = $accessMap[$token] ?? null;

        if (!$memberId) {
            return null;
        }

        $member = User::query()
            ->with('family:id,code_famille')
            ->find($memberId);

        if (!$member || !$this->memberCanAccessSurvey($member, $survey)) {
            unset($accessMap[$token]);
            $request->session()->put(self::ACCESS_SESSION_KEY, $accessMap);

            return null;
        }

        return $member;
    }

    private function memberCanAccessSurvey(User $member, Sondage $survey): bool
    {
        if ((int) $member->classe_id !== (int) $survey->classe_id) {
            return false;
        }

        return $this->sondageService
            ->getVisibleSondagesForUser($member)
            ->contains(fn ($item) => (int) ($item['id'] ?? 0) === (int) $survey->id);
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
}
