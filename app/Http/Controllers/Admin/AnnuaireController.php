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
     * Display annuaire principal (Admin - tous accès)
     */
    public function index(Request $request)
    {
        $data = $this->annuaireService->getAnnuaireData($request, 'admin');

        return Inertia::render('Admin/Annuaire/Index', [
            // Props attendues par la vue Admin/Annuaire/Index.jsx
            'members' => $data['data'],
            'classes' => $data['classes'] ?? [],
            'families' => [],
            'view' => $request->get('view', 'all'),
            'cotisations' => [],
            'user' => [
                'id' => Auth::id(),
                'role' => Auth::user()?->role,
            ],
            'stats' => $data['stats'],
            'filters' => $request->only(['search', 'classe', 'famille', 'statut', 'role', 'perPage', 'view']),
            'filterOptions' => [
                'classes' => $data['classes'] ?? [],
                'familles' => [],
                'statuts' => [
                    ['value' => 'active', 'label' => 'Actif'],
                    ['value' => 'inactive', 'label' => 'Inactif'],
                ],
                'roles' => $data['roles'] ?? [],
            ],
        ]);
    }

    /**
     * Recherche AJAX rapide
     */
    public function search(Request $request)
    {
        $results = $this->annuaireService->search($request->all(), 'admin');

        return response()->json([
            'success' => true,
            'data' => $results['data'],
            'pagination' => $results['pagination'],
            'stats' => $results['stats'],
        ]);
    }

    /**
     * Export Excel/PDF
     */
    public function export(Request $request)
    {
        $format = $request->get('format', 'excel');
        $data = $this->annuaireService->exportData($request->all(), 'admin');

        if ($format === 'pdf') {
            return $this->annuaireService->generatePDF($data);
        }

        return $this->annuaireService->generateExcel($data);
    }

    /**
     * Statistiques annuaire
     */
    public function stats(Request $request)
    {
        $stats = $this->annuaireService->getStats($request, 'admin');

        return response()->json([
            'success' => true,
            'stats' => $stats,
        ]);
    }
}
