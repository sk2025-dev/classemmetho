<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cotisation extends Model
{
    use HasFactory;

    public const PERIODICITE_MENSUEL = 'MENSUEL';
    public const PERIODICITE_HEBDOMADAIRE = 'HEBDOMADAIRE';
    public const PERIODICITE_TRIMESTRIEL = 'TRIMESTRIEL';
    public const PERIODICITE_ANNUEL = 'ANNUEL';
    public const PERIODICITE_UNIQUE = 'UNIQUE';

    public const STATUT_ACTIVE = 'ACTIVE';
    public const STATUT_SUSPENDUE = 'SUSPENDUE';
    public const STATUT_ANNULEE = 'ANNULEE';

    public const TARGET_SCOPE_FAMILLE = 'FAMILLE';
    public const TARGET_SCOPE_INDIVIDUELLE = 'INDIVIDUELLE';

    protected $fillable = [
        'nom',
        'montant',
        'periodicite',
        'statut',
        'target_scope',
        'target_employment_statuses',
        'target_genders',
        'target_rules',
        'classe_id',
        'created_by',
        'description',
        'date_debut',
        'date_fin',
        'date_echeance',
        'late_after_days',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'date_echeance' => 'date',
        'late_after_days' => 'integer',
        'target_employment_statuses' => 'array',
        'target_genders' => 'array',
        'target_rules' => 'array',
    ];

    public const RULE_TYPE_GENRE = 'GENRE';
    public const RULE_TYPE_EMPLOI = 'EMPLOI';
    public const RULE_TYPE_ENFANT = 'ENFANT';

    public const EMPLOYMENT_STATUSES = [
        'TRAVAILLEUR',
        'RETRAITE',
        'ETUDIANT',
        'SANS_EMPLOI',
    ];

    public function classe()
    {
        return $this->belongsTo(Classe::class, 'classe_id');
    }

    public function paiements()
    {
        return $this->hasMany(Paiement::class, 'cotisation_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Un membre est considéré enfant s'il a moins de 20 ans.
     */
    public function isEnfant(User $user): bool
    {
        if (!$user->date_naissance) {
            return false;
        }
        return $user->date_naissance->age < 20;
    }

    /**
     * Détermine le mode de ciblage à partir des règles stockées.
     * Retourne 'GENRE', 'EMPLOI' ou 'UNIVERSAL'.
     */
    private function getTargetMode(): string
    {
        $rules = collect($this->target_rules ?? []);
        if ($rules->where('type', self::RULE_TYPE_GENRE)->isNotEmpty()) {
            return self::RULE_TYPE_GENRE;
        }
        if ($rules->where('type', self::RULE_TYPE_EMPLOI)->isNotEmpty()) {
            return self::RULE_TYPE_EMPLOI;
        }
        return 'UNIVERSAL';
    }

    /**
     * Vérifier si une cotisation s'applique à un utilisateur.
     */
    public function appliesToUser(User $user): bool
    {
        $today = now()->toDateString();
        if ($this->date_debut && $this->date_debut->toDateString() > $today) {
            return false;
        }
        if ($this->date_fin && $this->date_fin->toDateString() < $today) {
            return false;
        }

        $rules = collect($this->target_rules ?? []);

        // Pas de règles → s'applique à tous
        if ($rules->isEmpty()) {
            return true;
        }

        $mode = $this->getTargetMode();

        // Pas de mode genre ni emploi → universel
        if ($mode === 'UNIVERSAL') {
            return true;
        }

        $isEnfant = $this->isEnfant($user);

        // Enfant : on cherche une règle ENFANT avec montant valide
        if ($isEnfant) {
            return $rules->contains(fn($r) =>
                strtoupper($r['type'] ?? '') === self::RULE_TYPE_ENFANT &&
                (int) ($r['amount'] ?? 0) >= 100
            );
        }

        // Ciblage par genre
        if ($mode === self::RULE_TYPE_GENRE) {
            $userGenre = strtoupper($user->genre ?? '');
            return $rules->contains(fn($r) =>
                strtoupper($r['type'] ?? '') === self::RULE_TYPE_GENRE &&
                strtoupper($r['value'] ?? '') === $userGenre &&
                (int) ($r['amount'] ?? 0) >= 100
            );
        }

        // Ciblage par statut d'emploi
        if ($mode === self::RULE_TYPE_EMPLOI) {
            $userEmploi = strtoupper($user->employment_status ?? '');
            // Statut inconnu → montant par défaut appliqué
            if (!$userEmploi) {
                return (int) $this->montant >= 100;
            }
            return $rules->contains(fn($r) =>
                strtoupper($r['type'] ?? '') === self::RULE_TYPE_EMPLOI &&
                strtoupper($r['value'] ?? '') === $userEmploi &&
                (int) ($r['amount'] ?? 0) >= 100
            );
        }

        return false;
    }

    /**
     * Retourne le montant applicable pour un utilisateur selon son profil.
     * Retourne null si la cotisation ne s'applique pas à cet utilisateur.
     */
    public function resolveAmountForUser(User $user): ?int
    {
        $rules = collect($this->target_rules ?? [])
            ->filter(fn($r) => is_array($r) && (int) ($r['amount'] ?? 0) >= 100);

        // Pas de règles → montant par défaut pour tous
        if ($rules->isEmpty()) {
            return (int) $this->montant >= 100 ? (int) $this->montant : null;
        }

        $isEnfant = $this->isEnfant($user);

        // Les enfants (< 20 ans) ont toujours la règle ENFANT, peu importe le mode
        if ($isEnfant) {
            $rule = $rules->first(fn($r) => strtoupper($r['type'] ?? '') === self::RULE_TYPE_ENFANT);
            return $rule ? (int) $rule['amount'] : null;
        }

        $mode = $this->getTargetMode();

        if ($mode === self::RULE_TYPE_GENRE) {
            $userGenre = strtoupper($user->genre ?? '');
            $rule = $rules->first(fn($r) =>
                strtoupper($r['type'] ?? '') === self::RULE_TYPE_GENRE &&
                strtoupper($r['value'] ?? '') === $userGenre
            );
            // Pas de règle pour ce genre → ne cotise pas
            return $rule ? (int) $rule['amount'] : null;
        }

        if ($mode === self::RULE_TYPE_EMPLOI) {
            $userEmploi = strtoupper($user->employment_status ?? '');
            // Statut inconnu → montant par défaut
            if (!$userEmploi) {
                return (int) $this->montant >= 100 ? (int) $this->montant : null;
            }
            $rule = $rules->first(fn($r) =>
                strtoupper($r['type'] ?? '') === self::RULE_TYPE_EMPLOI &&
                strtoupper($r['value'] ?? '') === $userEmploi
            );
            // Pas de règle pour ce statut → ne cotise pas
            return $rule ? (int) $rule['amount'] : null;
        }

        return (int) $this->montant >= 100 ? (int) $this->montant : null;
    }

    public function graceDays(): int
    {
        $days = (int) ($this->late_after_days ?? 2);
        return $days >= 0 ? $days : 2;
    }

    public function isLate(?\Carbon\CarbonInterface $today = null): bool
    {
        $baseDate = $this->date_echeance ?: $this->date_fin;
        if (!$baseDate) {
            return false;
        }

        $today = $today ? $today->copy()->startOfDay() : now()->startOfDay();
        $lateAt = $baseDate->copy()->subDays($this->graceDays())->startOfDay();

        return $today->greaterThanOrEqualTo($lateAt);
    }

    /**
     * Récupérer les cotisations applicables pour un utilisateur
     */
    public static function applicableFor(User $user)
    {
        return static::where('statut', self::STATUT_ACTIVE)
            ->where(function ($query) {
                $today = now()->toDateString();
                $query->whereNull('date_debut')
                    ->orWhere('date_debut', '<=', $today);
            })
            ->where(function ($query) {
                $today = now()->toDateString();
                $query->whereNull('date_fin')
                    ->orWhere('date_fin', '>=', $today);
            })
            ->get()
            ->filter(function ($cotisation) use ($user) {
                return $cotisation->appliesToUser($user);
            });
    }
}
