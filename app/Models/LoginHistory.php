<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LoginHistory extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'ip_address',
        'user_agent',
        'success',
        'metadata'
    ];

    protected $casts = [
        'success' => 'boolean',
        'metadata' => 'array',
        'deleted_at' => 'datetime',
    ];

    /**
     * Relations
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relations pour l'audit
     */
    public function deletedBy()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    public function updatedByUser()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

}
