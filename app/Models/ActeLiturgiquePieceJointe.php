<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActeLiturgiquePieceJointe extends Model
{
    use HasFactory;

    protected $table = 'actes_liturgiques_pieces_jointes';

    protected $fillable = [
        'acte_id',
        'path',
        'original_name',
        'mime_type',
        'size',
        'uploaded_by',
    ];

    public function acte()
    {
        return $this->belongsTo(ActeLiturgique::class, 'acte_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
