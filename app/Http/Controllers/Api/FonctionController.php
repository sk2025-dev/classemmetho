<?php

namespace App\Http\Controllers\Api;

use App\Models\Fonction;
use Illuminate\Routing\Controller;
use Illuminate\Support\Collection;

class FonctionController extends Controller
{
    /**
     * Récupérer toutes les fonctions d'église actives
     */
    public function index()
    {
        $fonctions = Fonction::select('id', 'nom', 'description')
            ->orderBy('nom')
            ->get();

        $this->normalizeCombinedFonctions($fonctions);

        return Fonction::select('id', 'nom', 'description')
            ->where('nom', 'not like', '%,%')
            ->orderBy('nom')
            ->get();
    }

    /**
     * Récupérer une fonction d'église spécifique
     */
    public function show($id)
    {
        return Fonction::findOrFail($id);
    }

    private function normalizeCombinedFonctions(Collection $fonctions): void
    {
        $existingByName = $fonctions->keyBy(
            fn ($f) => mb_strtolower(trim((string) $f->nom))
        );

        foreach ($fonctions as $fonction) {
            $name = trim((string) $fonction->nom);
            if ($name === '' || !str_contains($name, ',')) {
                continue;
            }

            $parts = array_filter(array_map('trim', explode(',', $name)));
            foreach ($parts as $part) {
                $key = mb_strtolower($part);
                if (isset($existingByName[$key])) {
                    continue;
                }

                $created = Fonction::firstOrCreate(['nom' => $part]);
                $existingByName[$key] = $created;
            }
        }
    }
}
