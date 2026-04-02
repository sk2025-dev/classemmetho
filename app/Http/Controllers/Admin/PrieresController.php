<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Priere;
use App\Models\PriereView;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PrieresController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        $priereIds = Priere::query()->pluck('id');

        if ($user && $priereIds->isNotEmpty()) {
            PriereView::upsert(
                $priereIds
                    ->map(fn ($priereId) => [
                        'user_id' => $user->id,
                        'priere_id' => $priereId,
                        'viewed_at' => now(),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ])
                    ->all(),
                ['user_id', 'priere_id'],
                ['viewed_at', 'updated_at'],
            );
        }

        return Inertia::render('Admin/Prieres/Index', [
            'authUser' => [
                'id' => $user?->id,
                'nom' => $user?->nom,
                'prenom' => $user?->prenom,
            ],
        ]);
    }
}
