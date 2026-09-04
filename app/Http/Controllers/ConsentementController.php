<?php

namespace App\Http\Controllers;

use App\Support\DataConsent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ConsentementController extends Controller
{
    public function show(): Response
    {
        $user = Auth::user();
        $family = $user->family;
        $estResponsableFamille = $family ? $family->responsable_id === $user->id : true;

        return Inertia::render('Consentement/Show', [
            'actif' => DataConsent::isEnabled(),
            'texte' => DataConsent::texte(),
            'dejaValide' => $user->aValideConsentement(),
            'peutValider' => $estResponsableFamille,
            'familleNom' => $family?->nom,
            'nomResponsable' => !$estResponsableFamille
                ? trim(($family?->responsable?->prenom ?? '') . ' ' . ($family?->responsable?->nom ?? ''))
                : null,
        ]);
    }

    public function valider(Request $request): RedirectResponse
    {
        $user = Auth::user();

        if (!DataConsent::isEnabled()) {
            return redirect('/dashboard');
        }

        $family = $user->family;

        if ($family) {
            if ($family->responsable_id !== $user->id) {
                abort(403, "Seul le responsable de famille peut valider les conditions pour tout le foyer.");
            }
            $family->validerConsentement($user);
        } else {
            $user->validerConsentementIndividuel();
        }

        return redirect('/dashboard')->with('success', 'Merci, les conditions ont été acceptées.');
    }
}
