<?php

namespace App\Console\Commands;

use App\Models\Inscription;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillUserEmploymentFields extends Command
{
    protected $signature = 'users:backfill-employment-fields
        {--dry-run : Show what would change without writing to DB}
        {--all-statuses : Include all inscription statuses (recommended)}
        {--status= : Filter by a specific inscription status}
        {--types= : Comma-separated inscription types to include (example: famille,conducteur)}';

    protected $description = 'Backfill users.profession, users.employment_status, users.profession_detail and users.relation from inscriptions data';

    public function handle(): int
    {
        $isDryRun = (bool) $this->option('dry-run');

        $query = Inscription::query()->whereNotNull('data');

        $statusFilter = trim((string) $this->option('status'));
        if ($statusFilter !== '') {
            $query->where('status', $statusFilter);
        } elseif (!(bool) $this->option('all-statuses')) {
            // Backward compatibility if someone explicitly disables all-statuses.
            $query->where('status', 'approuve');
        }

        $typesFilterRaw = trim((string) $this->option('types'));
        if ($typesFilterRaw !== '') {
            $types = array_values(array_filter(array_map('trim', explode(',', $typesFilterRaw))));
            if (!empty($types)) {
                $query->whereIn('type', $types);
            }
        }

        $inscriptions = $query->get();

        $this->line('Inscriptions candidates: ' . $inscriptions->count());

        $updatedUsers = 0;
        $scannedUsers = 0;

        DB::beginTransaction();

        try {
            foreach ($inscriptions as $inscription) {
                $data = $inscription->data;
                if (is_string($data)) {
                    $decoded = json_decode($data, true);
                    $data = is_array($decoded) ? $decoded : [];
                } elseif (!is_array($data)) {
                    $data = [];
                }

                if (empty($data)) {
                    continue;
                }

                // Responsable linked by inscription.user_id when present.
                $responsableUser = $this->findResponsibleUser($inscription, $data);
                if ($responsableUser) {
                    $scannedUsers++;

                    // Try to get employment_status from JSON first, then from inscription columns
                    $employmentStatus = $data['responsable']['employment_status']
                        ?? $data['employment_status']
                        ?? $inscription->responsable_employment_status
                        ?? null;

                    // Try to get profession_detail from JSON first, then from inscription columns
                    $professionDetail = $data['responsable']['profession_detail']
                        ?? $data['responsable']['profession']
                        ?? $data['profession_detail']
                        ?? $data['profession']
                        ?? $inscription->responsable_profession
                        ?? null;

                    // Try to get relation from JSON first, then from inscription columns
                    $relation = $data['responsable']['relation']
                        ?? $data['responsable']['lienParente']
                        ?? $data['relation']
                        ?? $data['lienParente']
                        ?? $inscription->responsable_lien_parente
                        ?? null;

                    $didUpdate = $this->applyFieldsToUser(
                        $responsableUser,
                        $this->resolveEmploymentStatus($employmentStatus),
                        $this->resolveProfessionDetail(is_array($data['responsable'] ?? null) ? $data['responsable'] : [], $professionDetail),
                        $this->resolveRelation(is_array($data['responsable'] ?? null) ? $data['responsable'] : [], $relation),
                        $isDryRun
                    );

                    if ($didUpdate) {
                        $updatedUsers++;
                    }
                }

                // Family members backfill from inscription JSON data.
                if (in_array($inscription->type, ['famille', 'conducteur'], true) && !empty($inscription->family_id) && !empty($data['membres']) && is_array($data['membres'])) {
                    foreach ($data['membres'] as $memberData) {
                        $nom = trim((string) ($memberData['nom'] ?? ''));
                        $prenom = trim((string) ($memberData['prenom'] ?? ''));

                        if ($nom === '' || $prenom === '') {
                            continue;
                        }

                        $member = User::query()
                            ->where('family_id', $inscription->family_id)
                            ->where('nom', $nom)
                            ->where('prenom', $prenom)
                            ->whereIn('role', ['membre_famille', 'membre'])
                            ->first();

                        if (!$member) {
                            continue;
                        }

                        $scannedUsers++;
                        $didUpdate = $this->applyFieldsToUser(
                            $member,
                            $this->resolveEmploymentStatus($memberData['employment_status'] ?? null),
                            $this->resolveProfessionDetail($memberData),
                            $this->resolveRelation($memberData),
                            $isDryRun
                        );

                        if ($didUpdate) {
                            $updatedUsers++;
                        }
                    }
                }
            }

            if ($isDryRun) {
                DB::rollBack();
                $this->info("Dry-run terminé. Utilisateurs scannés: {$scannedUsers}, utilisateurs à mettre à jour: {$updatedUsers}");
            } else {
                DB::commit();
                $this->info("Backfill terminé. Utilisateurs scannés: {$scannedUsers}, utilisateurs mis à jour: {$updatedUsers}");
            }

            return self::SUCCESS;
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error('Erreur pendant le backfill: ' . $e->getMessage());
            return self::FAILURE;
        }
    }

    private function findResponsibleUser(Inscription $inscription, array $data): ?User
    {
        if (!empty($inscription->user_id)) {
            $user = User::find($inscription->user_id);
            if ($user) {
                return $user;
            }
        }

        $email = trim((string) (
            $inscription->responsable_email
            ?? ($data['responsable']['email'] ?? null)
            ?? ($data['email'] ?? null)
            ?? ''
        ));

        if ($email !== '') {
            $byEmail = User::query()->where('email', $email)->first();
            if ($byEmail) {
                return $byEmail;
            }
        }

        if (!empty($inscription->family_id)) {
            $byFamilyRole = User::query()
                ->where('family_id', $inscription->family_id)
                ->whereIn('role', ['responsable_famille', 'conducteur', 'pasteur'])
                ->first();
            if ($byFamilyRole) {
                return $byFamilyRole;
            }
        }

        return null;
    }

    private function applyFieldsToUser(User $user, ?string $employmentStatus, ?string $professionDetail, ?string $relation, bool $isDryRun): bool
    {
        $payload = [];

        if (empty($user->employment_status) && !empty($employmentStatus)) {
            $payload['employment_status'] = $employmentStatus;
        }

        if (empty($user->profession_detail) && !empty($professionDetail)) {
            $payload['profession_detail'] = $professionDetail;
        }

        if (empty($user->profession) && !empty($professionDetail)) {
            $payload['profession'] = $professionDetail;
        }

        if (empty($user->relation) && !empty($relation)) {
            $payload['relation'] = $relation;
        }

        if (empty($payload)) {
            return false;
        }

        if ($isDryRun) {
            $this->line("[DRY-RUN] user_id={$user->id} => " . json_encode($payload, JSON_UNESCAPED_UNICODE));
            return true;
        }

        $user->update($payload);
        return true;
    }

    private function resolveEmploymentStatus(?string $value, ?string $fallback = null): ?string
    {
        $candidate = $value ?? $fallback;
        if (!is_string($candidate) || trim($candidate) === '') {
            return null;
        }

        $normalized = strtoupper(trim($candidate));
        $allowed = ['TRAVAILLEUR', 'RETRAITE', 'ETUDIANT', 'SANS_EMPLOI'];

        return in_array($normalized, $allowed, true) ? $normalized : null;
    }

    private function resolveProfessionDetail(array $personData, ?string $fallback = null): ?string
    {
        $value = $personData['profession_detail']
            ?? $personData['profession']
            ?? $fallback;

        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        return trim($value);
    }

    private function resolveRelation(array $personData, ?string $fallback = null): ?string
    {
        $value = $personData['relation']
            ?? $personData['lienParente']
            ?? $personData['lien_parente']
            ?? $fallback;

        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        return trim($value);
    }
}
