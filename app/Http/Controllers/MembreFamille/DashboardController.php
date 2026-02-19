<?php

namespace App\Http\Controllers\MembreFamille;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('MembreFamille/Dashboard', [
            'role' => auth()->user()->role,
        ]);
    }
}
