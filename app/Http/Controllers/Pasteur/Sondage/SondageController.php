<?php

namespace App\Http\Controllers\Pasteur\Sondage;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class SondageController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Pasteur/Sondage/Index');
    }
}
