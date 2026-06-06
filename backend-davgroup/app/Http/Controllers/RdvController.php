<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RdvController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'data' => [],
            'message' => 'Liste des rendez-vous à implémenter',
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
