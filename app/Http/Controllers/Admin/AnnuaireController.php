<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AnnuaireService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class AnnuaireController extends Controller
{
    protected AnnuaireService $annuaireService;

    public function __construct(AnnuaireService $annuaireService)
    {
        $this->annuaireService = $annuaireService;
    }

    /**
     * Determine the role scope for the authenticated user.
     */
    protected function getRoleScope(): string
    {
        $user = Auth::user();

        if (!$user) {
            return 'guest';
        }

        if ($user->role === 'admin') {
            return 'admin';
        }

        if ($user->role === 'conducteur') {
            return 'conducteur';
        }

        if ($user->role === 'responsable_famille') {
            return 'responsable_famille';
        }

        return 'user';
    }

    /**
     * Display annuaire principal avec tous les modes (admin, conducteur, responsable_famille).
     */
    public function index(Request $request)
    {
        $roleScope = $this->getRoleScope();
        $data = $this->annuaireService->getAnnuaireData($request, $roleScope);

        return Inertia::render('Admin/Annuaire/Index', [
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

    /**
     * Recherche AJAX (optionnel, utilisé par les filtres dynamiques).
     */
    public function search(Request $request)
    {
        $roleScope = $this->getRoleScope();
        $data = $this->annuaireService->getAnnuaireData($request, $roleScope);

        return response()->json([
            'success' => true,
            'data' => $data['members']['data'],
            'pagination' => [
                'current_page' => $data['members']['current_page'],
                'last_page' => ceil($data['members']['total'] / $data['members']['per_page']),
                'per_page' => $data['members']['per_page'],
                'total' => $data['members']['total'],
                'links' => $data['members']['links'],
            ],
            'stats' => $this->annuaireService->getStats($request, $roleScope),
        ]);
    }

    /**
     * Export Excel ou PDF des membres filtrés.
     */
    public function export(Request $request)
    {
        $format = $request->get('format', 'excel');
        $roleScope = $this->getRoleScope();

        $data = $this->annuaireService->exportData($request->all(), $roleScope);

        if ($format === 'pdf') {
            return $this->annuaireService->generatePDF($data);
        }

        return $this->annuaireService->generateExcel($data);
    }

    /**
     * Retourne les statistiques globales (utilisé éventuellement pour des widgets).
     */
    public function stats(Request $request)
    {
        $roleScope = $this->getRoleScope();
        $stats = $this->annuaireService->getStats($request, $roleScope);

        return response()->json([
            'success' => true,
            'stats' => $stats,
        ]);
    }
}
