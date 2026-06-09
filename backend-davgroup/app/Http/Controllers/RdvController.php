<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Rdv;

class RdvController extends Controller
{
    public function index(Request $request)
    {
        $rdvs = Rdv::orderBy('appointment_date', 'desc')->get();

        return response()->json([
            'data' => $rdvs,
            'message' => 'Liste des rendez-vous',
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'service' => ['required', 'string'],
            'date' => ['required', 'date'],
            'time' => ['required', 'string'],
            'customer_name' => ['required', 'string'],
            'customer_phone' => ['required', 'string'],
        ]);

        return response()->json([
            'data' => $data,
            'message' => 'Rendez-vous créé (mock).',
        ], 201);
    }
}
