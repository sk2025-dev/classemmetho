<?php

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use App\Http\Controllers\Controller;

class ProgrammesController extends Controller
{
    public function index()
    {
        // Commencez par une réponse simple sans données
        return Inertia::render('Admin/Programmes');
    }
}