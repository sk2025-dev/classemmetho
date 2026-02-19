<?php

namespace App\Http\Controllers\Pasteur;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Pasteur/Dashboard', [
            'role' => auth()->user()->role,
        ]);
    }
}
