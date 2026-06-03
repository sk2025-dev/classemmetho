<?php

namespace App\Http\Controllers;

use App\Models\ActeLiturgique;
use Illuminate\Http\Request;

class VerificationCertificatController extends Controller
{
    public function show(string $reference)
    {
        $acte = ActeLiturgique::with(['membre', 'classe'])
            ->where('reference', $reference)
            ->orWhere('id', $reference)
            ->first();

        return view('certificat-verification', [
            'acte' => $acte,
            'reference' => $reference,
        ]);
    }
}
