<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CampagneSacrement;
use App\Services\CampagneSacrementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class CampagneSacrementController extends Controller
{
    public function __construct(private CampagneSacrementService $service)
    {
    }

    public function index()
    {
        return redirect()->route('admin.administration', ['tab' => 'inscription_bapteme']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'annee' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'titre' => ['nullable', 'string', 'max:255'],
            'date_ouverture' => ['required', 'date'],
            'date_fermeture' => ['required', 'date', 'after_or_equal:date_ouverture'],
        ]);

        try {
            $campagne = $this->service->ouvrir($validated, Auth::id());
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages(['date_fermeture' => $e->getMessage()]);
        }

        return redirect()
            ->route('admin.administration', ['tab' => 'inscription_bapteme'])
            ->with('success', 'Inscriptions baptême / 1ère communion ouvertes.');
    }

    public function fermer(CampagneSacrement $campagne)
    {
        if ($campagne->statut !== CampagneSacrement::STATUT_OUVERTE) {
            return redirect()
                ->route('admin.administration', ['tab' => 'inscription_bapteme'])
                ->withErrors(['campagne' => 'Les inscriptions ne sont pas ouvertes.']);
        }

        $this->service->fermer($campagne, Auth::id());

        return redirect()
            ->route('admin.administration', ['tab' => 'inscription_bapteme'])
            ->with('success', 'Inscriptions fermées. Plus aucune nouvelle inscription baptême / 1ère communion.');
    }

    public function reouvrir(Request $request, CampagneSacrement $campagne)
    {
        $validated = $request->validate([
            'annee' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'titre' => ['nullable', 'string', 'max:255'],
            'date_ouverture' => ['required', 'date'],
            'date_fermeture' => ['required', 'date', 'after_or_equal:date_ouverture'],
            'motif_reouverture' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $this->service->reouvrir($campagne, $validated, Auth::id());
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages(['date_fermeture' => $e->getMessage()]);
        }

        return redirect()
            ->route('admin.administration', ['tab' => 'inscription_bapteme'])
            ->with('success', 'Inscriptions réouvertes.');
    }
}
