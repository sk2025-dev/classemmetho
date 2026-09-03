<?php

namespace App\Support;

use App\Models\Cotisation;

/**
 * Le module FIMECO est global, mais un versement reste un Paiement : la seule
 * chose qui marque un paiement comme « FIMECO » (par opposition à une autre
 * cotisation) est son cotisation_id. C'est aussi ce qui relie le module global
 * au suivi FIMECO par classe / par famille.
 *
 * Cette cotisation n'a pas vocation à être « collectée » (montant 0, aucune
 * échéance générée) : c'est un simple libellé technique. On la crée donc à la
 * volée plutôt que d'exiger une configuration manuelle préalable.
 */
final class FimecoCotisation
{
    public static function query()
    {
        return Cotisation::query()->whereRaw('LOWER(nom) LIKE ?', ['%fimeco%']);
    }

    /**
     * Garantit l'existence d'une cotisation FIMECO globale active et la renvoie.
     * Réactive une cotisation FIMECO existante suspendue plutôt que d'en créer
     * une seconde.
     */
    public static function ensureGlobal(?int $userId = null): Cotisation
    {
        $existing = self::query()
            ->orderByRaw('classe_id IS NULL DESC')
            ->orderByDesc('id')
            ->first();

        if ($existing) {
            if ($existing->statut !== Cotisation::STATUT_ACTIVE) {
                $existing->update(['statut' => Cotisation::STATUT_ACTIVE]);
            }

            return $existing;
        }

        return Cotisation::query()->create([
            'nom' => 'FIMECO',
            'montant' => 0,
            'periodicite' => Cotisation::PERIODICITE_ANNUEL,
            'statut' => Cotisation::STATUT_ACTIVE,
            'target_scope' => Cotisation::TARGET_SCOPE_FAMILLE,
            'classe_id' => null,
            'created_by' => $userId,
            'description' => 'Cotisation FIMECO globale — créée automatiquement par le module de gestion FIMECO.',
            'date_debut' => now()->toDateString(),
        ]);
    }
}
