<?php

namespace App\Models;

use App\Traits\TrackModifications;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Schema;

class ActeLiturgique extends Model
{
    use HasFactory, SoftDeletes, TrackModifications;

    protected $table = 'actes_liturgiques';

    protected $fillable = [
        'reference',
        'type_acte',
        'statut',
        'vu_par_demandeur',
        'membre_id',
        'classe_id',
        'conducteur_id',
        'bureau_conducteur_id',
        'pasteur_id',
        'date_souhaitee',
        'details',
        'note_conducteur',
        'note_pastorale',
        'note_admin',
        'created_by',
        // Nouveaux champs pour les annonces
        'date_publication',
        'date_expiration',
        'est_principale',
        'family_id',
        'publiee_par',
        'est_annonce',
        'target_role',
    ];

    protected $casts = [
        'date_souhaitee' => 'date',
        'date_publication' => 'datetime',
        'date_expiration' => 'datetime',
        'details' => 'array',
        'est_principale' => 'boolean',
        'vu_par_demandeur' => 'boolean',
    ];

    // Constantes pour les types d'actes
    public const TYPE_BAPTEME = 'bapteme';
    public const TYPE_PREMIERE_COMMUNION = 'premiere_communion';
    public const TYPE_MARIAGE = 'mariage';
    public const TYPE_NAISSANCE = 'naissance';
    public const TYPE_DECES = 'deces';
    public const TYPE_ANNOUNCE = 'annonce';
    public const TYPE_ANNOUNCE_LITURGIQUE = 'annonce_liturgique';
    public const TYPE_PRIERE = 'priere';
    public const TYPE_GRACE = 'grace';
    public const TYPE_GENERALE = 'generale';
    public const TYPE_FELICITATIONS = 'felicitations';

    public const ANNOUNCE_TYPES = [
        self::TYPE_ANNOUNCE,
        self::TYPE_ANNOUNCE_LITURGIQUE,
        self::TYPE_PRIERE,
        self::TYPE_GRACE,
        self::TYPE_GENERALE,
        self::TYPE_FELICITATIONS,
    ];

    // Cibles possibles pour un flash info
    public const TARGET_ALL = 'all';
    public const TARGET_CONDUCTEUR = 'conducteur';
    public const TARGET_RESPONSABLE_FAMILLE = 'responsable_famille';
    public const TARGET_PASTEUR = 'pasteur';

    public const TARGET_ROLES = [
        self::TARGET_ALL,
        self::TARGET_CONDUCTEUR,
        self::TARGET_RESPONSABLE_FAMILLE,
        self::TARGET_PASTEUR,
    ];

    // Constantes pour les statuts
    public const STATUT_Soumise = 'SOUMISE';
    public const STATUT_EN_ATTENTE_CONDUCTEUR = 'EN_ATTENTE_CONDUCTEUR';
    public const STATUT_TRANSMISE_AU_BUREAU_CONDUCTEUR = 'TRANSMISE_AU_BUREAU_CONDUCTEUR';
    public const STATUT_REFUSEE_PAR_BUREAU_CONDUCTEUR = 'REFUSEE_PAR_BUREAU_CONDUCTEUR';
    public const STATUT_TRANSMISE_AU_PASTEUR = 'TRANSMISE_AU_PASTEUR';
    public const STATUT_VALIDEE = 'VALIDEE';
    public const STATUT_REFUSEE_PAR_CONDUCTEUR = 'REFUSEE_PAR_CONDUCTEUR';
    public const STATUT_REFUSEE_PAR_PASTEUR = 'REFUSEE_PAR_PASTEUR';
    public const STATUT_CELEBRE = 'CELEBRE';
    public const STATUT_TERMINE = 'TERMINE';
    public const STATUT_PUBLIEE = 'PUBLIEE';
    public const STATUT_ARCHIVEE = 'ARCHIVEE';

    public const STATUTS_BLOQUANT_NOUVELLE_DEMANDE = [
        self::STATUT_Soumise,
        self::STATUT_EN_ATTENTE_CONDUCTEUR,
        self::STATUT_TRANSMISE_AU_BUREAU_CONDUCTEUR,
        self::STATUT_TRANSMISE_AU_PASTEUR,
        self::STATUT_VALIDEE,
        self::STATUT_PUBLIEE,
        self::STATUT_CELEBRE,
        self::STATUT_TERMINE,
    ];

    // Méthodes pour vérifier le type
    public function isAnnonce(): bool
    {
        return $this->est_annonce || in_array($this->type_acte, self::ANNOUNCE_TYPES, true);
    }

    public function isAnnonceGenerale(): bool
    {
        return $this->type_acte === self::TYPE_ANNOUNCE;
    }

    public function isAnnonceLiturgique(): bool
    {
        return $this->type_acte === self::TYPE_ANNOUNCE_LITURGIQUE;
    }

    // Relations
    public function membre(): BelongsTo
    {
        return $this->belongsTo(User::class, 'membre_id');
    }

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class, 'classe_id');
    }

    public function conducteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'conducteur_id');
    }

    public function bureauConducteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'bureau_conducteur_id');
    }

    public function pasteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pasteur_id');
    }

    public function createur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class, 'family_id');
    }

    public function publieePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'publiee_par');
    }

    public function historiques()
    {
        return $this->hasMany(ActeLiturgiqueHistorique::class, 'acte_id')->latest();
    }

    public function piecesJointes()
    {
        return $this->hasMany(ActeLiturgiquePieceJointe::class, 'acte_id')->latest();
    }

    // Scopes
    public function scopeAnnonces($query)
    {
        $table = $this->getTable();
        return $query->where(function ($q) use ($table) {
            $q->whereIn('type_acte', self::ANNOUNCE_TYPES);
            if (Schema::hasColumn($table, 'est_annonce')) {
                $q->orWhere('est_annonce', true);
            }
        });
    }

    public function scopePubliees($query)
    {
        return $query->where('statut', self::STATUT_PUBLIEE);
    }

    public function scopeEnAttente($query)
    {
        return $query->where('statut', self::STATUT_Soumise);
    }

    public function scopePrincipale($query)
    {
        return $query->where('est_principale', true);
    }

    // Méthodes de permission
    public function peutEtreModifiePar(User $user): bool
    {
        if ($this->statut !== self::STATUT_Soumise) {
            return false;
        }

        return $this->created_by === $user->id
            || ($this->family_id && $this->family_id === $user->family_id);
    }

    public function peutEtreValideParConducteur(User $user): bool
    {
        if ($this->statut !== self::STATUT_Soumise) {
            return false;
        }
        return in_array($user->role, ['conducteur', 'admin']);
    }

    public function peutEtreTransmiseAuPasteur(User $user): bool
    {
        if ($this->statut !== self::STATUT_EN_ATTENTE_CONDUCTEUR) {
            return false;
        }
        return in_array($user->role, ['conducteur', 'admin']);
    }

    public function peutEtrePublieePar(User $user): bool
    {
        if (!$this->isAnnonce()) {
            return false;
        }

        if ($this->statut !== self::STATUT_VALIDEE) {
            return false;
        }

        return in_array($user->role, ['pasteur', 'admin'], true);
    }

    public static function getTypeOptions(): array
    {
        return [
            self::TYPE_BAPTEME => 'Baptême',
            self::TYPE_PREMIERE_COMMUNION => 'Première Communion',
            self::TYPE_MARIAGE => 'Mariage',
            self::TYPE_NAISSANCE => 'Naissance',
            self::TYPE_DECES => 'Décès',
            self::TYPE_ANNOUNCE => 'Annonce générale',
            self::TYPE_ANNOUNCE_LITURGIQUE => 'Annonce liturgique',
            self::TYPE_PRIERE => 'Demande de prière',
            self::TYPE_GRACE => 'Action de grâce',
            self::TYPE_GENERALE => 'Annonce libre',
        ];
    }

    public static function getStatutOptions(): array
    {
        return [
            self::STATUT_Soumise => 'Soumise',
            self::STATUT_EN_ATTENTE_CONDUCTEUR => 'En attente du conducteur',
            self::STATUT_TRANSMISE_AU_PASTEUR => 'Transmise au pasteur',
            self::STATUT_VALIDEE => 'Validée',
            self::STATUT_REFUSEE_PAR_CONDUCTEUR => 'Refusée par le conducteur',
            self::STATUT_REFUSEE_PAR_PASTEUR => 'Refusée par le pasteur',
            self::STATUT_CELEBRE => 'Célébré',
            self::STATUT_TERMINE => 'Terminé',
            self::STATUT_PUBLIEE => 'Publiée',
            self::STATUT_ARCHIVEE => 'Archivée',
        ];
    }
    public static function statutsBloquantNouvelleDemande(): array
    {
        return self::STATUTS_BLOQUANT_NOUVELLE_DEMANDE;
    }
}
