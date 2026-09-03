<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FimecoImportLog extends Model
{
    public const TYPE_SOUSCRIPTIONS = 'souscriptions';
    public const TYPE_VERSEMENTS = 'versements';

    protected $fillable = [
        'type',
        'original_filename',
        'user_id',
        'success',
        'created_count',
        'updated_count',
        'duplicate_count',
        'skipped_count',
        'error_count',
        'message',
        'errors',
    ];

    protected $casts = [
        'success' => 'boolean',
        'created_count' => 'integer',
        'updated_count' => 'integer',
        'duplicate_count' => 'integer',
        'skipped_count' => 'integer',
        'error_count' => 'integer',
        'errors' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
