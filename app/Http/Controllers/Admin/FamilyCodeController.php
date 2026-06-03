<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Family;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FamilyCodeController extends Controller
{
    /**
     * Liste toutes les familles avec leurs codes (+ recherche par code ou nom)
     */
    public function index(Request $request)
    {
        $query = Family::with(['classe', 'responsable', 'ville'])
            ->orderBy('nom');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                    ->orWhere('code_famille', 'like', "%{$search}%");
            });
        }

        $families = $query->get()->map(fn($f) => [
            'id'           => $f->id,
            'nom'          => $f->nom,
            'code_famille' => $f->code_famille,
            'classe'       => $f->classe?->nom,
            'responsable'  => trim(($f->responsable?->prenom ?? '') . ' ' . ($f->responsable?->nom ?? '')),
            'ville'        => $f->ville?->nom,
            'telephone'    => $f->telephone,
            'created_at'   => $f->created_at?->format('d/m/Y'),
        ]);

        return Inertia::render('Admin/Families/Index', [
            'families' => $families,
            'search'   => $request->input('search', ''),
            'stats'    => [
                'total'          => Family::count(),
                'avec_code'      => Family::whereNotNull('code_famille')->count(),
                'sans_code'      => Family::whereNull('code_famille')->count(),
            ],
        ]);
    }

    /**
     * Génère les codes manquants pour toutes les familles qui n'en ont pas
     */
    public function generateAll()
    {
        $families = Family::whereNull('code_famille')->get();
        $count = $families->count();

        foreach ($families as $family) {
            $family->update(['code_famille' => Family::generateCode()]);
        }

        return back()->with('success', "{$count} code(s) généré(s) avec succès.");
    }

    /**
     * Génère / régénère le code d'une famille spécifique
     */
    public function generate(int $id)
    {
        $family = Family::findOrFail($id);
        $family->update(['code_famille' => Family::generateCode()]);

        return back()->with('success', "Nouveau code : {$family->code_famille}");
    }
}
