<?php

namespace App\Http\Controllers\Traits;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

trait BuildsAnnuaireProps
{
    protected function buildAnnuaireProps(array $data, Request $request): array
    {
        $classes = collect($data['classes'] ?? [])
            ->pluck('nom')
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        $families = collect($data['families'] ?? [])
            ->pluck('nom')
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        $roles = collect($data['roles'] ?? [])->filter()->unique()->values()->toArray();

        return [
            'members' => $data['data'],
            'classes' => $data['classes'] ?? [],
            'families' => $data['families'] ?? [],
            'view' => $request->get('view', 'all'),
            'cotisations' => [],
            'user' => [
                'id' => Auth::id(),
                'role' => Auth::user()?->role,
            ],
            'stats' => $data['stats'] ?? [],
            'filters' => $request->only(['search', 'classe', 'famille', 'statut', 'role', 'perPage', 'view']),
            'filterOptions' => [
                'classes' => $classes,
                'familles' => $families,
                'statuts' => ['baptise', 'non_baptise', 'communion', 'marie', 'decede'],
                'roles' => $roles,
            ],
        ];
    }
}
