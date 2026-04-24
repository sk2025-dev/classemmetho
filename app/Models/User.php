<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Helpers\PhotoHelper;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\GeneratesIdentifier;
use App\Traits\TrackModifications;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, GeneratesIdentifier, SoftDeletes;
    // DISABLED TrackModifications - causes issues with is_modified column


    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        // === IDENTIFIANTS DE BASE ===
        'identifier',
        'code_membre',
        'email',
        'password',
        'remember_token',

        // === DONNÉES PERSONNELLES ===
        'nom',
        'prenom',
        'genre',
        'date_naissance',
        'photo_path',
        'profile_photo_url',

        // === INFORMATIONS DE CONTACT ===
        'telephone',
        'telephone2',
        'profession',
        'employment_status',
        'profession_detail',
        'relation',

        // === RELATIONS ET SYSTÈME ===
        'family_id',
        'classe_id',
        'ville_id',
        'fonction_id',
        'role',
        'is_family_responsible',

        // === GESTION DU COMPTE ===
        'must_change_password',
        'last_login_at',
        'signature_path',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'must_change_password' => 'boolean',
        'is_family_responsible' => 'boolean',
        'date_naissance' => 'date',
        'last_login_at' => 'datetime',
    ];

    /**
     * Attributs immuables - ne peuvent pas être changés après création
     */
    protected $guarded = [];

    /**
     * Événements du modèle
     */
    protected static function boot()
    {
        parent::boot();

        // Générer un `identifier` automatique si non fourni avant insertion
        static::creating(function ($user) {
            if (empty($user->identifier)) {
                $user->identifier = static::generateIdentifier($user->nom ?? '', $user->prenom ?? '', $user->date_naissance ?? null);
            }
            // Générer un `code_membre` automatique si non fourni
            if (empty($user->code_membre)) {
                $user->code_membre = static::generateCodeMembre();
            }
        });

        // Empêcher le changement de family_id si déjà défini
        static::updating(function ($user) {
            if ($user->isDirty('family_id') && $user->family_id_locked) {
                throw new \Exception('Cannot change family_id after user creation! User #' . $user->id);
            }
        });

        // Empêcher de définir family_id_locked à false
        static::updating(function ($user) {
            if ($user->isDirty('family_id_locked') && !$user->family_id_locked) {
                throw new \Exception('Cannot unlock family_id once locked! User #' . $user->id);
            }
        });
    }

    /**
     * Génère un code membre au format A + incrémentation
     * Ex: A1, A2, A3, ...
     * Chaque nouvel utilisateur reçoit un nouveau numéro
     */
    public static function generateCodeMembre(): string
    {
        // Compter le nombre total d'utilisateurs (non supprimés) pour obtenir le prochain numéro
        $count = static::count();
        $nextNumber = $count + 1;

        // Générer le code au format A + numéro
        $code = 'A' . $nextNumber;

        // S'assurer que le code est unique (sécurité supplémentaire)
        while (static::withTrashed()->where('code_membre', $code)->exists()) {
            $nextNumber++;
            $code = 'A' . $nextNumber;
        }

        return $code;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Relations pour l'audit
     */
    public function deletedBy()
    {
        return $this->belongsTo(User::class, 'id_supp');
    }

    public function updatedByUser()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Autres relations
     */
    /**
     * La famille de cet utilisateur (si responsable ou membre avec compte)
     */
    public function family()
    {
        return $this->belongsTo(Family::class, 'family_id');
    }

    public function transferOriginFamily()
    {
        return $this->belongsTo(Family::class, 'transfer_origin_family_id');
    }

    public function transferredToFamily()
    {
        return $this->belongsTo(Family::class, 'transferred_to_family_id');
    }

    public function transferredToUser()
    {
        return $this->belongsTo(User::class, 'transferred_to_user_id');
    }

    /**
     * La classe de cet utilisateur
     */
    public function classe()
    {
        return $this->belongsTo(Classe::class, 'classe_id');
    }

    /**
     * La ville de résidence de cet utilisateur
     */
    public function ville()
    {
        return $this->belongsTo(Ville::class, 'ville_id');
    }

    /**
     * Les inscriptions créées par cet utilisateur (admin/créateur)
     */
    public function createdInscriptions()
    {
        return $this->hasMany(Inscription::class, 'created_by');
    }

    /**
     * Les inscriptions approuvées par cet utilisateur en tant qu'admin
     */
    public function approvedInscriptionsAsAdmin()
    {
        return $this->hasMany(Inscription::class, 'admin_id');
    }

    /**
     * Les inscriptions approuvées par cet utilisateur en tant que conducteur
     */
    public function approvedInscriptionsAsConductor()
    {
        return $this->hasMany(Inscription::class, 'conducteur_id');
    }

    /**
     * Les familles dont cet utilisateur est le responsable
     */
    public function familiesAsResponsible()
    {
        return $this->hasMany(Family::class, 'responsable_id');
    }

    /**
     * Les inscriptions de cet utilisateur (celles liées après approbation)
     */
    public function inscriptions()
    {
        return $this->hasMany(Inscription::class, 'user_id');
    }

    public function loginHistories()
    {
        return $this->hasMany(LoginHistory::class);
    }

    /**
     * Les notifications pour cet utilisateur
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Relation avec la fonction d'église
     * Un utilisateur peut avoir UNE fonction principale
     */
    public function fonction()
    {
        return $this->belongsTo(Fonction::class, 'fonction_id');
    }

    /**
     * Fonctions d'église (multi-fonctions via pivot)
     */
    public function fonctions()
    {
        return $this->belongsToMany(Fonction::class, 'fonction_user')
            ->withTimestamps();
    }

    /**
     * Les sacrements/événements religieux de cet utilisateur
     * Relation hasOne car chaque utilisateur n'a qu'un seul enregistrement UserSacrement
     */
    public function sacrements()
    {
        return $this->hasOne(UserSacrement::class);
    }

    /**
     * Actes liturgiques où cet utilisateur est le membre concerné.
     */
    public function actesLiturgiquesCommeMembre()
    {
        return $this->hasMany(ActeLiturgique::class, 'membre_id');
    }

    /**
     * Actes liturgiques traités en tant que conducteur.
     */
    public function actesLiturgiquesCommeConducteur()
    {
        return $this->hasMany(ActeLiturgique::class, 'conducteur_id');
    }

    /**
     * Actes liturgiques traités en tant que pasteur.
     */
    public function actesLiturgiquesCommePasteur()
    {
        return $this->hasMany(ActeLiturgique::class, 'pasteur_id');
    }

    /**
     * Actes liturgiques créés par cet utilisateur.
     */
    public function actesLiturgiquesCrees()
    {
        return $this->hasMany(ActeLiturgique::class, 'created_by');
    }

    /**
     * Historique des changements de statut effectués par cet utilisateur.
     */
    public function actesLiturgiquesHistoriques()
    {
        return $this->hasMany(ActeLiturgiqueHistorique::class, 'acteur_id');
    }

    /**
     * Pièces jointes d'actes liturgiques importées par cet utilisateur.
     */
    public function actesLiturgiquesPiecesJointes()
    {
        return $this->hasMany(ActeLiturgiquePieceJointe::class, 'uploaded_by');
    }

    /**
     * Les classes gérées par cet utilisateur en tant que conducteur
     */
    public function getManagedClasses()
    {
        // Le conducteur gère sa propre classe
        if ($this->classe_id) {
            return Classe::where('id', $this->classe_id)->get();
        }
        return collect(); // Retourner une collection vide si pas de classe
    }

    /**
     * Accesseur pour le nom complet (nom + prenom)
     */
    public function getNameAttribute()
    {
        return $this->nom . ' ' . $this->prenom;
    }

    /**
     * Retourne l'URL de photo de profil persistée, sinon la calcule depuis photo_path.
     */
    public function getProfilePhotoUrlAttribute($value)
    {
        return $value ?: PhotoHelper::getPhotoUrl(
            $this->attributes['photo_path'] ?? null,
            $this->attributes['prenom'] ?? null,
            $this->attributes['nom'] ?? null
        );
    }

    /**
     * Récupérer tous les événements créés par ce conducteur
     */
    public function specialEvents()
    {
        return $this->hasMany(SpecialEvent::class, 'created_by');
    }
}
