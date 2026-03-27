<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Http\Controllers\Controller;
use App\Services\AnnuaireService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnnuaireController extends Controller
{
    protected AnnuaireService $annuaireService;

    public function __construct(AnnuaireService $annuaireService)
    {
        $this->annuaireService = $annuaireService;
    }

    public function index(Request $request)
    {
        $roleScope = 'responsable_famille';
        $data = $this->annuaireService->getAnnuaireData($request, $roleScope);

        return Inertia::render('ResponsableFamille/Annuaire/Index', [
            'members' => $data['members'],
            'families' => $data['families'],
            'classes' => $data['classes'],
            'view' => $data['view'],
            'cotisations' => $data['cotisations'],
            'user' => $data['user'],
            'filters' => $data['filters'],
            'filterOptions' => $data['filterOptions'],
        ]);
    }
}