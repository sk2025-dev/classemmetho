<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\GeneratesIdentifier;
use App\Traits\TrackModifications;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, GeneratesIdentifier, SoftDeletes, TrackModifications;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        // === IDENTIFIANTS DE BASE ===
        'identifier',
        'email',
        'password',
        'remember_token',

        // === DONNÉES PERSONNELLES ===
        'nom',
        'prenom',
        'genre',
        'date_naissance',
        'photo_path',

        // === INFORMATIONS DE CONTACT ===
        'telephone',
        'telephone2',
        'profession',
        'relation',

        // === RELATIONS ET SYSTÈME ===
        'family_id',
        'classe_id',
        'ville_id',
        'fonction_id',
        'role',
        'statut',
        'is_family_responsible',

        // === GESTION DU COMPTE ===
        'must_change_password',
        'last_login_at',
        'is_active',
        'updated_by',
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
        'is_active' => 'boolean',
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
     * Les sacrements/événements religieux de cet utilisateur
     * Relation hasOne car chaque utilisateur n'a qu'un seul enregistrement UserSacrement
     */
    public function sacrements()
    {
        return $this->hasOne(UserSacrement::class);
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
     * Accesseur pour l'URL de la photo de profil
     * Utilise PhotoHelper pour générer l'URL complète
     */
    public function getProfilePhotoUrlAttribute()
    {
        return \App\Helpers\PhotoHelper::getPhotoUrl($this->photo_path, $this->prenom, $this->nom);
    }
}
