<?php

namespace App\Http\Controllers\Conducteur\Sondage;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SondageController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        return Inertia::render('Conducteur/Sondage/Index', [
            'sondages' => [],
            'authUser' => [
                'id' => $user?->id,
                'nom' => $user?->nom,
                'prenom' => $user?->prenom,
            ],
        ]);
    }

    public function create(): Response
    {
        $user = Auth::user();

        return Inertia::render('Conducteur/Sondage/Create', [
            'authUser' => [
                'id' => $user?->id,
                'nom' => $user?->nom,
                'prenom' => $user?->prenom,
            ],
        ]);
    }

    public function preview(string $id = 'new'): Response
    {
        $user = Auth::user();

        return Inertia::render('Conducteur/Sondage/Preview', [
            'surveyId' => $id,
            'authUser' => [
                'id' => $user?->id,
                'nom' => $user?->nom,
                'prenom' => $user?->prenom,
            ],
        ]);
    }
}
