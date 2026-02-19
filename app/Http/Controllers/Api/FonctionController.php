<?php

namespace App\Http\Controllers\Api;

use App\Models\Fonction;
use Illuminate\Routing\Controller;

class FonctionController extends Controller
{
    /**
     * Récupérer toutes les fonctions d'église actives
     */
    public function index()
    {
        return Fonction::select('id', 'nom', 'description')
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
}
