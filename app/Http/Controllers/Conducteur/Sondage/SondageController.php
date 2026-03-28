<?php

namespace App\Http\Controllers\Conducteur\Sondage;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class SondageController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Conducteur/Sondage/Index');
    }
}
