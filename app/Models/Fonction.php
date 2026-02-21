<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fonction extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $table = 'fonctions';

    protected $fillable = [
        'nom',
        'description',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Obtenir les utilisateurs ayant cette fonction
     */
    public function users()
    {
        return $this->hasMany(User::class, 'fonction_id');
    }

    /**
     * Obtenir les inscriptions avec cette fonction
     */
    public function inscriptions()
    {
        return $this->hasMany(Inscription::class, 'fonction_id');
    }

    /**
     * Obtenir les logs d'audit pour cette fonction
     */
    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class, 'record_id')->where('table_name', 'fonctions');
    }
}
