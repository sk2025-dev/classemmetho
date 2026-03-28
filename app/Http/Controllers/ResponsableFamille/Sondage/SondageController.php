<?php

namespace App\Http\Controllers\ResponsableFamille\Sondage;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class SondageController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('ResponsableFamille/Sondage/Index');
    }
}
