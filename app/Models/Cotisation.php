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
     * Vérifier si une cotisation s'applique à un utilisateur
     */
    public function appliesToUser(User $user): bool
    {
        // Vérifier les dates
        $today = now()->toDateString();
        if ($this->date_debut && $this->date_debut > $today) {
            return false;
        }
        if ($this->date_fin && $this->date_fin < $today) {
            return false;
        }

        // Vérifier le statut d'emploi si critères définis
        if (!empty($this->target_employment_statuses) && is_array($this->target_employment_statuses)) {
            if (!in_array($user->employment_status, $this->target_employment_statuses)) {
                return false;
            }
        }

        // Vérifier le genre si critères définis
        if (!empty($this->target_genders) && is_array($this->target_genders)) {
            if (!in_array($user->genre, $this->target_genders)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Retourne le montant cible pour un utilisateur selon les regles priorisees.
     */
    public function resolveAmountForUser(User $user): ?int
    {
        $rules = collect($this->target_rules ?? [])
            ->filter(fn($rule) => is_array($rule))
            ->sortBy(fn($rule) => (int) ($rule['priority'] ?? 999));

        foreach ($rules as $rule) {
            $type = strtoupper((string) ($rule['type'] ?? ''));
            $value = strtoupper((string) ($rule['value'] ?? ''));
            $amount = (int) ($rule['amount'] ?? 0);

            if ($amount <= 0) {
                continue;
            }

            if ($type === self::RULE_TYPE_ENFANT && $user->role === 'membre_famille') {
                return $amount;
            }

            if ($type === self::RULE_TYPE_GENRE && strtoupper((string) $user->genre) === $value) {
                return $amount;
            }

            if ($type === self::RULE_TYPE_EMPLOI && strtoupper((string) $user->employment_status) === $value) {
                return $amount;
            }
        }

        return (int) $this->montant > 0 ? (int) $this->montant : null;
    }

    public function graceDays(): int
    {
        $days = (int) ($this->late_after_days ?? 2);
        return $days >= 0 ? $days : 2;
    }

    public function isLate(?\Carbon\CarbonInterface $today = null): bool
    {
        if (!$this->date_echeance) {
            return false;
        }

        $today = $today ? $today->copy()->startOfDay() : now()->startOfDay();
        $lateAt = $this->date_echeance->copy()->addDays($this->graceDays())->startOfDay();

        return $today->greaterThan($lateAt);
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
