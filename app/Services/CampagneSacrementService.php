<?php

namespace App\Services;

use App\Models\CampagneSacrement;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use InvalidArgumentException;

class CampagneSacrementService
{
    /** Types d'actes soumis à la campagne annuelle baptême / 1ère communion. */
    public const TYPES_GATED = [
        'bapteme',
        'premiere_communion',
        'bapteme_premiere_communion',
    ];

    public function isGatedType(?string $typeActe): bool
    {
        return in_array(strtolower((string) $typeActe), self::TYPES_GATED, true);
    }

    public function tableReady(): bool
    {
        return Schema::hasTable('campagnes_sacrements');
    }

    public function latest(): ?CampagneSacrement
    {
        if (! $this->tableReady()) {
            return null;
        }

        return CampagneSacrement::query()->latest('id')->first();
    }

    public function activeOpen(?Carbon $at = null): ?CampagneSacrement
    {
        if (! $this->tableReady()) {
            return null;
        }

        $day = ($at ?? now())->toDateString();

        $campagne = CampagneSacrement::query()
            ->where('statut', CampagneSacrement::STATUT_OUVERTE)
            ->whereNull('archivee_at')
            ->whereDate('date_ouverture', '<=', $day)
            ->whereDate('date_fermeture', '>=', $day)
            ->orderByDesc('id')
            ->first();

        return $campagne;
    }

    public function isInscriptionOpen(?Carbon $at = null): bool
    {
        return $this->activeOpen($at) !== null;
    }

    /**
     * Payload Inertia pour les écrans famille / admin.
     */
    public function publicStatus(): array
    {
        $active = $this->activeOpen();
        $latest = $this->latest();

        return [
            'inscriptions_ouvertes' => $active !== null,
            'campagne' => ($active ?? $latest)?->toPublicArray(),
            'types_concernes' => self::TYPES_GATED,
            'message_fermee' => $active
                ? null
                : 'Les inscriptions baptême / 1ère communion sont fermées. Elles seront possibles uniquement après ouverture (ou réouverture) par l’administration.',
        ];
    }

    /**
     * Bloque la soumission si le type est gated et la campagne fermée.
     */
    public function assertAcceptsInscription(?string $typeActe): void
    {
        if (! $this->isGatedType($typeActe)) {
            return;
        }

        if ($this->isInscriptionOpen()) {
            return;
        }

        throw new InvalidArgumentException(
            'Les inscriptions baptême / 1ère communion sont fermées pour le moment. Contactez l’administration si une réouverture est nécessaire.'
        );
    }

    public function ouvrir(array $data, int $adminId): CampagneSacrement
    {
        return DB::transaction(function () use ($data, $adminId) {
            // Serialize administration even before the very first campaign exists.
            User::orderBy('id')->lockForUpdate()->firstOrFail();
            $this->checkAdmin($adminId);
            $this->checkDates($data);
            $open = CampagneSacrement::where('statut', 'ouverte')->lockForUpdate()->get();
            foreach ($open as $campaign) {
                if ($campaign->date_fermeture->gte(today())) {
                    throw new InvalidArgumentException('Fermez la campagne ouverte avant d’en créer une autre.');
                }
                $this->close($campaign, $adminId);
            }

            return CampagneSacrement::create([
                'annee' => (int) ($data['annee'] ?? Carbon::parse($data['date_ouverture'])->year),
                'titre' => $data['titre'] ?? 'Inscriptions aux sacrements',
                'date_ouverture' => $data['date_ouverture'], 'date_fermeture' => $data['date_fermeture'],
                'statut' => 'ouverte', 'created_by' => $adminId,
                'journal' => [$this->event($adminId, 'ouverture')],
            ]);
        }, 3);
    }

    public function fermer(CampagneSacrement $campagne, int $adminId): CampagneSacrement
    {
        return DB::transaction(function () use ($campagne, $adminId) {
            $this->checkAdmin($adminId);
            $campagne = CampagneSacrement::lockForUpdate()->findOrFail($campagne->id);
            if ($campagne->archivee_at || $campagne->statut !== 'ouverte') {
                throw new InvalidArgumentException('Cette campagne ne peut pas être fermée.');
            }

            return $this->close($campagne, $adminId);
        });
    }

    public function reouvrir(CampagneSacrement $campagne, array $data, int $adminId): CampagneSacrement
    {
        return DB::transaction(function () use ($campagne, $data, $adminId) {
            User::orderBy('id')->lockForUpdate()->firstOrFail();
            $this->checkAdmin($adminId);
            $this->checkDates($data);
            $campagne = CampagneSacrement::lockForUpdate()->findOrFail($campagne->id);
            if ($campagne->archivee_at) {
                throw new InvalidArgumentException('Une campagne archivée ne peut pas être réouverte.');
            }
            if (trim($data['motif_reouverture'] ?? '') === '') {
                throw new InvalidArgumentException('Le motif de réouverture est obligatoire.');
            }
            if (isset($data['annee']) && (int) $data['annee'] !== (int) $campagne->annee) {
                throw new InvalidArgumentException('L’année d’une campagne existante ne peut pas être changée.');
            }
            if (CampagneSacrement::where('statut', 'ouverte')->where('id', '!=', $campagne->id)->lockForUpdate()->exists()) {
                throw new InvalidArgumentException('Fermez l’autre campagne avant cette réouverture.');
            }
            $campagne->update([
                'date_ouverture' => $data['date_ouverture'], 'date_fermeture' => $data['date_fermeture'],
                'statut' => 'ouverte', 'reouverte_at' => now(), 'reouverte_par' => $adminId,
                'motif_reouverture' => $data['motif_reouverture'],
                'journal' => [...($campagne->journal ?? []), $this->event($adminId, 'reouverture', $data['motif_reouverture'])],
            ]);

            return $campagne->fresh();
        }, 3);
    }

    private function close(CampagneSacrement $campagne, int $adminId): CampagneSacrement
    {
        $campagne->update(['statut' => 'fermee', 'fermee_at' => now(), 'fermee_par' => $adminId,
            'journal' => [...($campagne->journal ?? []), $this->event($adminId, 'fermeture')]]);

        return $campagne->fresh();
    }

    private function checkAdmin(int $id): void
    {
        abort_unless(User::findOrFail($id)->role === 'admin', 403);
    }

    private function checkDates(array $data): void
    {
        if (Carbon::parse($data['date_fermeture'])->lt(Carbon::parse($data['date_ouverture']))) {
            throw new InvalidArgumentException('La fermeture doit suivre l’ouverture.');
        }
    }

    private function event(int $actor, string $action, string $motif = ''): array
    {
        return ['acteur_id' => $actor, 'action' => $action, 'motif' => $motif, 'date' => now()->toIso8601String()];
    }
}
