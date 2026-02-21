<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\TrackModifications;

class Inscription extends Model
{
    use HasFactory, TrackModifications;

    protected $table = 'inscriptions';

    /**
     * IMPORTANT: Structure de la table Inscription (Table d'archivage)
     *
     * Colonnes critiques:
     * - type: family, responsable, membre
     * - family_temp_key: clé temporaire pour regrouper les membres d'une même famille
     * - data: JSON contenant toutes les informations du formulaire
     * - photo_path: chemin du fichier stocké dans storage/app/public/
     * - status: pending, approved, rejected
     * - admin_id / conducteur_id: approbateurs
     * - admin_approved_at / conducteur_approved_at: timestamps d'approbation
     * - raison_rejet: raison du rejet si applicable
     *
     * Colonne JSON `data`:
     * - Contient les données COMPLÈTES du formulaire soumis
     * - Structure selon le type d'inscription
     * - Ne doit PAS être dupliquée dans les colonnes de la table
     *
     * ⚠️ Les inscriptions ne sont JAMAIS supprimées, seulement archivées avec status = rejected
     */
    protected $fillable = [
        // === TYPE ET IDENTIFIANTS ===
        'type',
        'family_temp_key',

        // === DONNÉES DANS JSON ===
        'data',

        // === PHOTOS (chemin fichier + URL publique) ===
        'photo_path',
        'profile_photo_url',

        // === CLASSE ET LOCALISATION ===
        'classe_id',
        'ville_id',

        // === STATUT ET APPROBATION ===
        'status',
        'admin_id',
        'admin_approved_at',
        'conducteur_id',
        'conducteur_approved_at',
        'raison_rejet',

        // === DONNÉES RESPONSABLE (pour type=famille) ===
        'responsable_nom',
        'responsable_prenom',
        'responsable_email',
        'responsable_tel',
        'responsable_telephone2',
        'responsable_date_naissance',
        'responsable_genre',
        'responsable_lien_parente',
        'responsable_profession',
        'responsable_fonction',

        // === STATUT MATRIMONIAL ET SACREMENTS DU RESPONSABLE ===
        'responsable_statut_marital',
        'responsable_date_mariage',
        'responsable_lieu_mariage',
        'responsable_date_divorce',
        'responsable_lieu_divorce',
        'responsable_date_deces',
        'responsable_lieu_deces',
        'responsable_baptise',
        'responsable_date_bapteme',
        'responsable_lieu_bapteme',
        'responsable_premiere_communion',
        'responsable_date_premiere_communion',
        'responsable_lieu_premiere_communion',
        'responsable_marie_religieusement',
        'responsable_date_mariage_religieux',
        'responsable_lieu_mariage_religieux',
    ];

    protected $casts = [
        'data' => 'array',
        'admin_approved_at' => 'datetime',
        'conducteur_approved_at' => 'datetime',
    ];

    /**
     * Relations
     */

    /**
     * L'admin qui a approuvé cette inscription
     */
    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    /**
     * Le conducteur qui a approuvé cette inscription
     */
    public function conducteur()
    {
        return $this->belongsTo(User::class, 'conducteur_id');
    }

    /**
     * Mutateur pour auto-supprimer les fichiers avant suppression
     */
    protected static function booted()
    {
        static::deleting(function ($inscription) {
            // Supprimer le fichier photo si photo_path existe
            if ($inscription->photo_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($inscription->photo_path)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($inscription->photo_path);
            }

            // Supprimer les photos des membres dans data
            if ($inscription->data && isset($inscription->data['membres'])) {
                foreach ($inscription->data['membres'] as $membre) {
                    if (isset($membre['photo_path']) && \Illuminate\Support\Facades\Storage::disk('public')->exists($membre['photo_path'])) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($membre['photo_path']);
                    }
                }
            }
        });
    }
}
