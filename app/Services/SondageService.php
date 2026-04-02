<?php

namespace App\Services;

use App\Models\Sondage;
use App\Models\Classe;
use App\Models\User;
use App\Models\SondageReponse;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class SondageService
{
    public function generateSurveyCodeForClasse(int|Classe|null $classe, ?int $ignoreSurveyId = null): string
    {
        $classeModel = $classe instanceof Classe
            ? $classe
            : Classe::query()->findOrFail($classe);

        $prefix = $this->buildClasseCodePrefix($classeModel->nom);
        $query = Sondage::query()
            ->where('classe_id', $classeModel->id)
            ->when($ignoreSurveyId, fn ($builder) => $builder->where('id', '!=', $ignoreSurveyId));

        $maxNumber = $query
            ->get(['code'])
            ->map(function (Sondage $sondage) use ($prefix) {
                $code = trim((string) $sondage->code);

                if (!preg_match('/^SOND\-' . preg_quote($prefix, '/') . '\-(\d{3})$/', $code, $matches)) {
                    return 0;
                }

                return (int) ($matches[1] ?? 0);
            })
            ->max();

        $nextNumber = ((int) $maxNumber) + 1;

        return sprintf('SOND-%s-%03d', $prefix, $nextNumber);
    }

    public function ensureUniqueSurveyCode(Sondage $sondage): string
    {
        $currentCode = trim((string) $sondage->code);

        $hasDuplicate = $currentCode !== ''
            && Sondage::query()
                ->where('code', $currentCode)
                ->where('id', '!=', $sondage->id)
                ->exists();

        if ($currentCode !== '' && !$hasDuplicate) {
            return $currentCode;
        }

        $newCode = $this->generateSurveyCodeForClasse($sondage->classe_id, $sondage->id);

        $sondage->forceFill([
            'code' => $newCode,
        ])->save();

        return $newCode;
    }

    public function repairSurveyCodesForClasse(?int $classeId): void
    {
        if (!$classeId) {
            return;
        }

        Sondage::query()
            ->where('classe_id', $classeId)
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->each(fn (Sondage $sondage) => $this->ensureUniqueSurveyCode($sondage));
    }

    public function repairAllSurveyCodes(): void
    {
        Sondage::query()
            ->orderBy('classe_id')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->each(fn (Sondage $sondage) => $this->ensureUniqueSurveyCode($sondage));
    }

    public function buildAnonymousProfileSnapshot(User $user): array
    {
        return [
            '_member_id' => $user->id,
            'genre' => $this->normalizeProfileValue(
                $this->labelGenre($user->genre),
                'Non renseigne',
            ),
            'role' => $this->normalizeProfileValue(
                $this->labelRole($user->role),
                'Autre',
            ),
            'employment_status' => $this->normalizeProfileValue(
                $this->normalizeEmploymentStatusLabel($user->employment_status, $user->profession),
                'Non renseignee',
            ),
            'tranche_age' => $this->normalizeProfileValue(
                $this->formatAgeRangeLabel($user->date_naissance),
                'Non renseignee',
            ),
        ];
    }

    public function buildPublicProfileSnapshot(array $profile = []): array
    {
        return [
            'genre' => $this->normalizeProfileValue(
                trim((string) data_get($profile, 'genre', '')),
                'Non renseigne',
            ),
            'role' => $this->normalizeProfileValue(
                trim((string) data_get($profile, 'role', '')),
                'Autres',
            ),
            'employment_status' => $this->normalizeProfileValue(
                $this->normalizeEmploymentStatusLabel(data_get($profile, 'employment_status')),
                'Non renseignee',
            ),
            'tranche_age' => $this->normalizeProfileValue(
                $this->formatAgeRangeLabel(data_get($profile, 'date_naissance')),
                'Non renseignee',
            ),
        ];
    }

    public function ensurePublicToken(Sondage $sondage): string
    {
        if (trim((string) $sondage->public_token) !== '') {
            return $sondage->public_token;
        }

        do {
            $token = Str::lower(Str::random(40));
        } while (Sondage::query()->where('public_token', $token)->exists());

        $sondage->forceFill([
            'public_token' => $token,
        ])->save();

        return $token;
    }

    public function isPubliclyAccessible(Sondage $sondage): bool
    {
        return $this->resolveStatut($sondage) !== 'Brouillon'
            && trim((string) $sondage->diffusion) === 'Lien partage'
            && trim((string) $sondage->public_token) !== '';
    }

    public function makePublicRespondentKey(int $sondageId, Request $request): string
    {
        $fingerprint = implode('|', [
            $sondageId,
            (string) $request->session()->getId(),
            (string) $request->ip(),
            Str::limit((string) $request->userAgent(), 120, ''),
        ]);

        return hash_hmac(
            'sha256',
            $fingerprint,
            config('app.key') ?: 'sondage-public',
        );
    }

    public function hasPublicResponded(int $sondageId, Request $request): bool
    {
        return SondageReponse::query()
            ->where('sondage_id', $sondageId)
            ->where('respondent_key', $this->makePublicRespondentKey($sondageId, $request))
            ->exists();
    }

    public function buildPublicSurveyPayload(Sondage $survey): array
    {
        $responseCount = $this->countEligibleResponses($survey->responses ?? []);

        return [
            'id' => $survey->id,
            'code' => $survey->code,
            'publicUrl' => $this->buildPublicSurveyUrl($survey),
            'titre' => $survey->titre,
            'description' => $survey->description,
            'objectif' => $survey->objectif,
            'audience' => $survey->audience,
            'dateCreation' => optional($survey->created_at)?->toDateString(),
            'dateEcheance' => optional($survey->date_echeance)?->toDateString(),
            'statut' => $this->resolveStatut($survey),
            'classe' => $survey->classe?->nom,
            'createur' => trim(($survey->createur?->prenom ?? '') . ' ' . ($survey->createur?->nom ?? '')) ?: 'Non renseigne',
            'participants' => $responseCount,
            'reponses' => $responseCount,
            'tauxParticipation' => 100,
            'questions' => $survey->questions ?? [],
        ];
    }

    public function buildPublicSurveyUrl(Sondage $sondage): ?string
    {
        if (trim((string) $sondage->public_token) === '') {
            return null;
        }

        return route('sondages.public.show', $sondage->public_token);
    }

    public function resolvePublicStatus(Sondage $sondage): string
    {
        return $this->resolveStatut($sondage);
    }

    public function labelRole(?string $role): string
    {
        $normalized = strtolower(trim((string) $role));

        return match ($normalized) {
            'conducteur' => 'Conducteurs',
            'responsable_famille' => 'Responsables de famille',
            'membre_famille' => 'Membres de famille',
            'pasteur' => 'Pasteurs',
            'admin' => 'Administrateurs',
            default => 'Autres',
        };
    }

    public function labelGenre(?string $genre): string
    {
        $normalized = strtoupper(trim((string) $genre));

        return match ($normalized) {
            'M', 'H', 'HOMME', 'MASCULIN' => 'Hommes',
            'F', 'FEMME', 'FEMININ', 'FÉMININ' => 'Femmes',
            default => 'Non renseigne',
        };
    }

    public function formatBirthDateLabel(mixed $date): ?string
    {
        $parsedDate = $this->parseBirthDate($date);

        if (!$parsedDate) {
            return null;
        }

        return $parsedDate->format('d/m/Y');
    }

    public function formatAgeRangeLabel(mixed $date): ?string
    {
        $parsedDate = $this->parseBirthDate($date);

        if (!$parsedDate) {
            return null;
        }

        $age = $parsedDate->age;

        return match (true) {
            $age < 18 => 'Moins de 18 ans',
            $age <= 25 => '18 a 25 ans',
            $age <= 35 => '26 a 35 ans',
            $age <= 50 => '36 a 50 ans',
            default => '51 ans et plus',
        };
    }

    public function labelEmploymentStatus(?string $employmentStatus, ?string $profession = null): string
    {
        $normalized = strtoupper(trim((string) $employmentStatus));

        if ($normalized !== '') {
            return match ($normalized) {
                'TRAVAILLEUR' => 'Travailleurs',
                'RETRAITE', 'RETRAITES', 'RETRAITE(S)', 'RETRAITEE', 'RETRAITEES' => 'Retraite',
                'ETUDIANT', 'ÉTUDIANT' => 'Etudiants',
                'SANS_EMPLOI' => 'Sans emploi',
                default => ucwords(strtolower(str_replace('_', ' ', $normalized))),
            };
        }

        $profession = trim((string) $profession);

        return $profession !== '' ? $profession : 'Non renseignee';
    }

    public function getClasseSondages(?int $classeId): Collection
    {
        if (!$classeId) {
            return collect();
        }

        $this->repairSurveyCodesForClasse($classeId);

        $participantCount = $this->countEligibleParticipantsForClasse($classeId);

        return Sondage::query()
            ->with([
                'createur:id,nom,prenom',
                'classe:id,nom',
                'responses:id,sondage_id,respondent_profile',
            ])
            ->where('classe_id', $classeId)
            ->latest()
            ->get()
            ->map(fn (Sondage $sondage) => $this->formatSurveyListItem(
                $sondage,
                $participantCount,
                $this->countEligibleResponses($sondage->responses),
            ))
            ->values();
    }

    public function getAllSondages(): Collection
    {
        $this->repairAllSurveyCodes();

        $participantCounts = User::query()
            ->selectRaw('classe_id, COUNT(*) as aggregate')
            ->whereNotNull('classe_id')
            ->where('role', '!=', 'pasteur')
            ->groupBy('classe_id')
            ->pluck('aggregate', 'classe_id');

        return Sondage::query()
            ->with([
                'createur:id,nom,prenom',
                'classe:id,nom',
                'responses:id,sondage_id,respondent_profile',
            ])
            ->latest()
            ->get()
            ->map(function (Sondage $sondage) use ($participantCounts) {
                $participantCount = (int) ($participantCounts[$sondage->classe_id] ?? 0);

                return $this->formatSurveyListItem(
                    $sondage,
                    $participantCount,
                    $this->countEligibleResponses($sondage->responses),
                );
            })
            ->values();
    }

    public function buildSurveyAnalyticsPayload(Sondage $survey, int $participantCount): array
    {
        $responses = $survey->responses instanceof Collection
            ? $survey->responses
            : collect($survey->responses);
        $responses = $this->excludePasteurResponses($responses);
        $responses = $this->hydrateRealProfileData($survey, $responses);

        $responseCount = $responses->count();
        $participationRate = $participantCount > 0
            ? (int) round(($responseCount / $participantCount) * 100)
            : 0;

        return [
            'survey' => [
                'id' => $survey->id,
                'code' => $survey->code,
                'publicUrl' => $this->buildPublicSurveyUrl($survey),
                'titre' => $survey->titre,
                'description' => $survey->description,
                'objectif' => $survey->objectif,
                'audience' => $survey->audience,
                'dateCreation' => optional($survey->created_at)?->toDateString(),
                'dateEcheance' => optional($survey->date_echeance)?->toDateString(),
                'statut' => $this->resolveStatut($survey),
                'classe' => $survey->classe?->nom,
                'createur' => trim(($survey->createur?->prenom ?? '') . ' ' . ($survey->createur?->nom ?? '')) ?: 'Non renseigne',
                'participants' => $participantCount,
                'reponses' => $responseCount,
                'tauxParticipation' => $participationRate,
                'questions' => $survey->questions ?? [],
            ],
            'responseStats' => $this->buildResponseStats($survey->questions ?? [], $responses),
            'profileStats' => $this->buildProfileStats($responses),
            'responses' => $responses
                ->map(function (SondageReponse $response, int $index) {
                    return [
                        'id' => $response->id,
                        'label' => 'Reponse ' . ($index + 1),
                        'submittedAt' => optional($response->submitted_at)?->toIso8601String(),
                        'profile' => $this->sanitizeRespondentProfileForAnalytics(
                            $response->respondent_profile ?? [],
                        ),
                        'answers' => $response->reponses ?? [],
                    ];
                })
                ->values(),
        ];
    }

    public function getVisibleSondagesForUser(User $user): Collection
    {
        return $this->getClasseSondages($user->classe_id)
            ->filter(function (array $sondage) use ($user) {
                if ($sondage['statut'] === 'Brouillon') {
                    return false;
                }

                return $this->audienceMatchesRole(
                    $sondage['audience'] ?? null,
                    $user->role,
                );
            })
            ->values()
            ->map(function (array $sondage) use ($user) {
                $sondage['aDejaRepondu'] = $this->hasUserResponded(
                    (int) $sondage['id'],
                    $user,
                );

                return $sondage;
            });
    }

    public function findVisibleSondageForUser(User $user, int $sondageId): ?array
    {
        return $this->getVisibleSondagesForUser($user)
            ->firstWhere('id', $sondageId);
    }

    public function hasUserResponded(int $sondageId, User $user): bool
    {
        return SondageReponse::query()
            ->where('sondage_id', $sondageId)
            ->where('respondent_key', $this->makeRespondentKey($sondageId, $user))
            ->exists();
    }

    public function getUserResponseAnswers(int $sondageId, User $user): array
    {
        return SondageReponse::query()
            ->where('sondage_id', $sondageId)
            ->where('respondent_key', $this->makeRespondentKey($sondageId, $user))
            ->value('reponses') ?? [];
    }

    public function makeRespondentKey(int $sondageId, User $user): string
    {
        return hash_hmac(
            'sha256',
            $sondageId . '|' . $user->id,
            config('app.key') ?: 'sondage-anonyme',
        );
    }

    private function normalizeProfileValue(?string $value, string $fallback): string
    {
        $normalized = trim((string) $value);

        return $normalized !== '' ? $normalized : $fallback;
    }

    private function buildClasseCodePrefix(?string $classeName): string
    {
        $normalized = strtoupper((string) $classeName);
        $normalized = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $normalized) ?: $normalized;
        $normalized = preg_replace('/[^A-Z0-9]/', '', $normalized) ?: 'CLAS';

        return substr(str_pad($normalized, 4, 'X'), 0, 4);
    }

    private function countEligibleParticipantsForClasse(int $classeId): int
    {
        return User::query()
            ->where('classe_id', $classeId)
            ->where('role', '!=', 'pasteur')
            ->count();
    }

    private function countEligibleResponses(iterable $responses): int
    {
        return $this->excludePasteurResponses(collect($responses))->count();
    }

    private function excludePasteurResponses(Collection $responses): Collection
    {
        $pasteurRoleLabel = $this->labelRole('pasteur');

        return $responses
            ->filter(function ($response) use ($pasteurRoleLabel) {
                $role = trim((string) data_get($response, 'respondent_profile.role', ''));

                return $role !== $pasteurRoleLabel;
            })
            ->values();
    }

    private function formatSurveyListItem(Sondage $sondage, int $participantCount, int $responseCount): array
    {
        $tauxParticipation = $participantCount > 0
            ? (int) round(($responseCount / $participantCount) * 100)
            : 0;

        return [
            'id' => $sondage->id,
            'code' => $sondage->code,
            'publicUrl' => $this->buildPublicSurveyUrl($sondage),
            'titre' => $sondage->titre,
            'description' => $sondage->description,
            'objectif' => $sondage->objectif,
            'audience' => $sondage->audience,
            'questions' => $sondage->questions ?? [],
            'dateCreation' => optional($sondage->created_at)?->toDateString(),
            'dateEcheance' => optional($sondage->date_echeance)?->toDateString(),
            'statut' => $this->resolveStatut($sondage),
            'createur' => trim(($sondage->createur?->prenom ?? '') . ' ' . ($sondage->createur?->nom ?? '')) ?: 'Non renseigne',
            'created_by_name' => trim(($sondage->createur?->prenom ?? '') . ' ' . ($sondage->createur?->nom ?? '')) ?: 'Non renseigne',
            'created_by_prenom' => $sondage->createur?->prenom,
            'created_by_nom' => $sondage->createur?->nom,
            'participants' => $participantCount,
            'participant_count' => $participantCount,
            'reponses' => $responseCount,
            'response_count' => $responseCount,
            'tauxParticipation' => $tauxParticipation,
            'taux_participation' => $tauxParticipation,
            'canEdit' => $sondage->statut === 'draft' || $responseCount === 0,
            'canPublish' => $sondage->statut === 'draft' && $this->isSurveyReadyForPublication($sondage),
            'classe' => $sondage->classe?->nom,
            'classe_id' => $sondage->classe_id,
        ];
    }

    private function isSurveyReadyForPublication(Sondage $sondage): bool
    {
        if (trim((string) $sondage->titre) === '' || trim((string) $sondage->audience) === '') {
            return false;
        }

        $questions = collect($sondage->questions ?? []);

        if ($questions->isEmpty()) {
            return false;
        }

        return $questions->every(function ($question) {
            $title = trim((string) data_get($question, 'title', ''));
            $type = trim((string) data_get($question, 'type', 'text'));
            $options = collect(data_get($question, 'options', []))
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

                if (in_array($questionType, ['checkbox', 'yes_no', 'rating'], true)) {
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

                if ($questionType === 'multiple') {
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
                'key' => 'employment_status',
                'title' => 'Repartition socio-pro',
                'subtitle' => 'Situation socio-professionnelle des repondants, sans information nominative.',
                'items' => $this->aggregateProfileDistribution($responses, 'employment_status'),
            ],
            [
                'key' => 'tranche_age',
                'title' => 'Repartition par tranche d\'age',
                'subtitle' => 'Lecture anonyme des reponses selon la tranche d\'age des repondants.',
                'items' => $this->aggregateProfileDistribution($responses, 'tranche_age'),
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
                    'tranche_age' => 'Non renseignee',
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

    private function hydrateRealProfileData(Sondage $survey, Collection $responses): Collection
    {
        if (!$survey->id || !$survey->classe_id || $responses->isEmpty()) {
            return $responses;
        }

        $users = User::query()
            ->where('classe_id', $survey->classe_id)
            ->where('role', '!=', 'pasteur')
            ->get(['id', 'date_naissance', 'employment_status', 'profession']);

        $usersByRespondentKey = $users
            ->mapWithKeys(fn (User $user) => [
                $this->makeRespondentKey($survey->id, $user) => $user,
            ]);
        $usersById = $users->keyBy('id');

        return $responses
            ->map(function (SondageReponse $response) use ($usersByRespondentKey, $usersById) {
                $profile = $response->respondent_profile ?? [];
                $employmentStatus = $this->normalizeEmploymentStatusLabel(
                    data_get($profile, 'employment_status'),
                );
                $ageRange = $this->formatAgeRangeLabel(
                    data_get($profile, 'date_naissance'),
                ) ?? trim((string) data_get($profile, 'tranche_age', ''));

                if ($employmentStatus !== null) {
                    $profile['employment_status'] = $employmentStatus;
                }

                if ($ageRange !== '') {
                    $profile['tranche_age'] = $ageRange;
                    $response->setAttribute('respondent_profile', $profile);

                    return $response;
                }

                $user = $usersById->get((int) data_get($profile, '_member_id'))
                    ?? $usersByRespondentKey->get($response->respondent_key);

                if (!$user) {
                    return $response;
                }

                $profile['_member_id'] = $user->id;
                if ($employmentStatus === null) {
                    $profile['employment_status'] = $this->normalizeProfileValue(
                        $this->normalizeEmploymentStatusLabel(
                            $user->employment_status,
                            $user->profession,
                        ),
                        'Non renseignee',
                    );
                }
                $profile['tranche_age'] = $this->normalizeProfileValue(
                    $this->formatAgeRangeLabel($user->date_naissance),
                    'Non renseignee',
                );

                $response->setAttribute('respondent_profile', $profile);

                return $response;
            })
            ->values();
    }

    private function sanitizeRespondentProfileForAnalytics(array $profile): array
    {
        return collect($profile)
            ->mapWithKeys(function ($value, $key) use ($profile) {
                if ((string) $key === 'date_naissance') {
                    return [];
                }

                if ((string) $key === 'tranche_age' && trim((string) $value) === '') {
                    return [
                        'tranche_age' => $this->normalizeProfileValue(
                            $this->formatAgeRangeLabel(data_get($profile, 'date_naissance')),
                            'Non renseignee',
                        ),
                    ];
                }

                return [$key => $value];
            })
            ->reject(fn ($value, $key) => str_starts_with((string) $key, '_'))
            ->all();
    }

    private function parseBirthDate(mixed $date): ?Carbon
    {
        if ($date instanceof Carbon) {
            return $date->copy();
        }

        if ($date instanceof \DateTimeInterface) {
            return Carbon::instance($date);
        }

        $value = trim((string) $date);

        if ($value === '') {
            return null;
        }

        foreach (['Y-m-d', 'd/m/Y'] as $format) {
            try {
                return Carbon::createFromFormat($format, $value);
            } catch (\Throwable) {
            }
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function normalizeEmploymentStatusLabel(
        mixed $employmentStatus,
        ?string $profession = null,
    ): ?string {
        $value = trim((string) $employmentStatus);

        if ($value === '') {
            $profession = trim((string) $profession);

            return $profession !== '' ? $profession : null;
        }

        return $this->labelEmploymentStatus($value, $profession);
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

    private function audienceMatchesRole(?string $audience, ?string $role): bool
    {
        $normalizedAudience = trim((string) $audience);
        $normalizedRole = trim((string) $role);

        if ($normalizedAudience === '' || $normalizedAudience === 'Tout le monde (tous les membres)') {
            return true;
        }

        return match ($normalizedAudience) {
            'Responsables de famille' => $normalizedRole === 'responsable_famille',
            'Conducteurs de classe' => $normalizedRole === 'conducteur',
            'Membres de famille' => $normalizedRole === 'membre_famille',
            'Pasteurs' => false,
            default => true,
        };
    }
}
