<?php

namespace App\Http\Controllers\ResponsableFamille;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Traits\BuildsAnnuaireProps;
use App\Services\AnnuaireService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnnuaireController extends Controller
{
    use BuildsAnnuaireProps;

    protected AnnuaireService $annuaireService;

    public function __construct(AnnuaireService $annuaireService)
    {
        $this->annuaireService = $annuaireService;
    }

    public function index(Request $request)
    {
        $data = $this->annuaireService->getAnnuaireData($request, 'responsable_famille');

        return Inertia::render('ResponsableFamille/Annuaire/Index', $this->buildAnnuaireProps($data, $request));
    }
}
