<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;

class SiteSettingController extends Controller
{
    public const CARTE_THEME_KEY = 'carte_virtuelle_theme_texte';
    public const CARTE_THEME_DEFAULT = '« Qui enverrai-je, et qui marchera pour nous ? Me voici, envoie-moi » – Ésaïe 6:8';

    public const PASTEUR_PRINCIPAL_KEY = 'pasteur_principal_nom';
    public const PASTEUR_PRINCIPAL_DEFAULT = '';

    /**
     * Met à jour le nom du Pasteur Principal (destinataire / signataire des
     * fiches d'actes liturgiques, ex. l'annonce de décès en 3 pages).
     */
    public function updatePasteurPrincipal(Request $request)
    {
        $validated = $request->validate([
            'pasteur_principal_nom' => 'nullable|string|max:150',
        ]);

        SiteSetting::set(
            self::PASTEUR_PRINCIPAL_KEY,
            $validated['pasteur_principal_nom'] ?? null,
        );

        return back()->with('success', 'Nom du Pasteur Principal mis à jour avec succès.');
    }

    /**
     * Met à jour le thème (verset) affiché en pied de la carte virtuelle de membre.
     */
    public function updateCarteTheme(Request $request)
    {
        $validated = $request->validate([
            'carte_virtuelle_theme_texte' => 'nullable|string|max:255',
        ]);

        SiteSetting::set(
            self::CARTE_THEME_KEY,
            $validated['carte_virtuelle_theme_texte'] ?? null,
        );

        return back()->with('success', 'Thème de la carte virtuelle mis à jour avec succès.');
    }
}
