<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inscription;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        // Compter les inscriptions en attente
        $pendingInscriptions = Inscription::where('status', 'en_attente')->count();

        return Inertia::render('Admin/Dashboard', [
            'role' => auth()->user()->role,
            'pendingInscriptions' => $pendingInscriptions,
        ]);
    }
}
