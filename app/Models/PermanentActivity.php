<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PermanentActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'type', 'tag', 'day', 'time', 'title',
        'speaker', 'prayer', 'master', 'choir', 'is_parish'
    ];
}