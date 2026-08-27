<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;

class SiteSettingController extends Controller
{
    public const CARTE_THEME_KEY = 'carte_virtuelle_theme_texte';
    public const CARTE_THEME_DEFAULT = '« Qui enverrai-je, et qui marchera pour nous ? Me voici, envoie-moi » – Ésaïe 6:8';

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
