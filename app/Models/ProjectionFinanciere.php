<?php

namespace App\Models;

use Illuminate\Support\Collection;

class ProjectionFinanciere
{
    /**
     * Calcule un résumé financier simple à partir des cotisations et paiements.
     */
    public static function summarize(Collection $cotisations, Collection $paiements): array
    {
        $expected = (int) $cotisations->sum('montant_attendu');
        $paid = (int) $paiements->sum('montant');
        $due = max(0, $expected - $paid);

        return [
            'expected' => $expected,
            'paid' => $paid,
            'due' => $due,
            'payment_rate' => $expected > 0 ? round(($paid / $expected) * 100, 2) : 0,
        ];
    }
}
