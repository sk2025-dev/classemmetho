<?php

namespace App\Http\Controllers\Api;

use App\Models\Classe;
use Illuminate\Routing\Controller;

class ClasseController extends Controller
{
    /**
     * Récupérer toutes les classes
     */
    public function index()
    {
        return Classe::select('id', 'nom', 'description')
            ->get();
    }

    /**
     * Récupérer une classe spécifique
     */
    public function show($id)
    {
        return Classe::findOrFail($id);
    }
}
