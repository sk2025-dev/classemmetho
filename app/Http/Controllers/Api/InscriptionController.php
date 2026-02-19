<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inscription;
use Illuminate\Http\Request;

class InscriptionController extends Controller
{
    /**
     * Get pending inscriptions
     */
    public function pending()
    {
        $inscriptions = Inscription::where('status', 'en_attente')
            ->orderBy('created_at', 'desc')
            ->get()
            ->makeHidden(['data', 'admin_approved_at', 'conducteur_approved_at']);

        return response()->json($inscriptions);
    }

    /**
     * Get single inscription details
     */
    public function show($id)
    {
        $inscription = Inscription::findOrFail($id);
        return response()->json($inscription);
    }
}
