<?php

namespace App\Http\Controllers\MembreFamille;

use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        return Inertia::render('MembreFamille/Dashboard', [
            'role' => $user->role,
            'flashAnnouncements' => $flashAnnouncements,
        ]);
    }
}
