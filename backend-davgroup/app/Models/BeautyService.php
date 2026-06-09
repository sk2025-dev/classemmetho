<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BeautyService extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'section_key',
        'category_key',
        'title',
        'subtitle',
        'duration',
        'price',
        'image_path',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];
}
