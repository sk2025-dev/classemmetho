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
            'flashAnnouncements' => ActeLiturgique::query()
                ->where('est_annonce', true)
                ->whereNotNull('pasteur_id')
                ->whereIn('statut', [ActeLiturgique::STATUT_VALIDEE, ActeLiturgique::STATUT_PUBLIEE])
                ->orderByDesc('date_publication')
                ->orderByDesc('updated_at')
                ->limit(12)
                ->get()
                ->map(function (ActeLiturgique $annonce) {
                    $text = trim((string) ($annonce->details['contenu'] ?? $annonce->message ?? ''));

                    if ($text === '') {
                        $text = 'Annonce paroissiale publiee.';
                    }

                    return [
                        'id' => $annonce->id,
                        'text' => $text,
                    ];
                })
                ->values(),
        ]);
    }
}
