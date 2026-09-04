<?php

namespace App\Services;

use App\Models\Classe;
use App\Models\Cotisation;
use App\Models\Family;
use App\Models\FimecoSouscription;
use App\Models\Paiement;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Suivi de la cotisation FIMECO à l'échelle d'une classe : souscriptions et
 * versements par famille, KPI agrégés, et classement de la classe parmi
 * toutes les autres classes. Partagé entre le Conducteur (module Trésorerie)
 * et le Point Focal FIMECO (module dédié, portée classe uniquement).
 */
class FimecoClasseSuiviService
{
    /**
     * Années disponibles pour une classe : ses propres souscriptions, celles
     * saisies sans classe (globales), toujours complétées par l'année en cours.
     */
    public function anneesDisponibles(?int $classeId): Collection
    {
        return FimecoSouscription::query()
            ->where(function ($query) use ($classeId) {
                $query->whereNull('classe_id')
                    ->orWhere('classe_id', $classeId);
            })
            ->distinct()
            ->pluck('annee')
            ->push(now()->year)
            ->unique()
            ->sortDesc()
            ->values();
    }

    /**
     * Suivi FIMECO par famille pour une classe et une année données, plus le
     * KPI agrégé de la classe.
     *
     * @return array{suivi: Collection, kpi: array}
     */
    public function suiviPourClasse(int $classeId, int $annee): array
    {
        $fimecoSouscriptions = FimecoSouscription::query()
            ->where('annee', $annee)
            ->where(function ($query) use ($classeId) {
                $query->whereNull('classe_id')
                    ->orWhere('classe_id', $classeId);
            })
            ->pluck('montant_souscrit', 'family_id');

        $fimeco = Cotisation::query()
            ->whereRaw('LOWER(nom) LIKE ?', ['%fimeco%'])
            ->where(function ($query) use ($classeId) {
                $query->whereNull('classe_id')
                    ->orWhere('classe_id', $classeId);
            })
            ->orderByDesc('id')
            ->first();

        $famillesClasse = Family::query()
            ->where('classe_id', $classeId)
            ->get(['id', 'nom', 'code_famille']);

        $paiementsParFamilleFimeco = $fimeco
            ? Paiement::query()
                ->select('family_id', DB::raw('SUM(montant) as total_paye'))
                ->whereIn('family_id', $famillesClasse->pluck('id'))
                ->where('cotisation_id', $fimeco->id)
                ->where('year', $annee)
                ->groupBy('family_id')
                ->pluck('total_paye', 'family_id')
            : collect();

        $suivi = $famillesClasse->map(function (Family $famille) use ($paiementsParFamilleFimeco, $fimecoSouscriptions) {
            $paid = (int) ($paiementsParFamilleFimeco[$famille->id] ?? 0);
            $target = (int) ($fimecoSouscriptions[$famille->id] ?? 0);
            $due = max(0, $target - $paid);
            $statut = $target === 0 ? 'NON SOUSCRIT' : ($due === 0 ? 'A JOUR' : 'EN RETARD');

            return [
                'family_id' => $famille->id,
                'code_famille' => $famille->code_famille,
                'famille' => $famille->nom ?? 'Sans famille',
                'montant_souscrit' => $target,
                'montant_cible' => $target,
                'montant_paye' => $paid,
                'montant_restant' => $due,
                'statut' => $statut,
            ];
        })->sortBy('famille')->values();

        $cible = (int) $suivi->sum('montant_cible');
        $paye = (int) $suivi->sum('montant_paye');

        $kpi = [
            'montant_cible' => $cible,
            'montant_paye' => $paye,
            'montant_restant' => (int) $suivi->sum('montant_restant'),
            'taux_recouvrement' => $cible > 0
                ? min(100, round(($paye / $cible) * 100, 1))
                : 0,
            'familles_total' => $suivi->count(),
            'familles_a_jour' => $suivi->where('statut', 'A JOUR')->count(),
            'familles_en_retard' => $suivi->where('statut', 'EN RETARD')->count(),
            'familles_non_souscrit' => $suivi->where('statut', 'NON SOUSCRIT')->count(),
        ];

        return ['suivi' => $suivi, 'kpi' => $kpi];
    }

    /**
     * Classement de toutes les classes pour la cotisation FIMECO d'une année
     * donnée (souscriptions vs. paiements enregistrés), avec le rang de
     * $classeId si elle apparaît dans le classement.
     */
    public function classementClasses(int $annee, ?int $classeId): array
    {
        $fimecoCotisationIds = Cotisation::query()
            ->whereRaw('LOWER(nom) LIKE ?', ['%fimeco%'])
            ->pluck('id');

        $souscriptionsParClasse = FimecoSouscription::query()
            ->where('fimeco_souscriptions.annee', $annee)
            ->whereNotNull('fimeco_souscriptions.family_id')
            ->join('families', 'families.id', '=', 'fimeco_souscriptions.family_id')
            ->whereNotNull('families.classe_id')
            ->selectRaw('families.classe_id as classe_id, SUM(fimeco_souscriptions.montant_souscrit) as total')
            ->groupBy('families.classe_id')
            ->pluck('total', 'classe_id');

        $paiementsParClasse = Paiement::query()
            ->whereIn('paiements.cotisation_id', $fimecoCotisationIds)
            ->where('paiements.year', $annee)
            ->whereNotNull('paiements.family_id')
            ->join('families', 'families.id', '=', 'paiements.family_id')
            ->whereNotNull('families.classe_id')
            ->selectRaw('families.classe_id as classe_id, SUM(paiements.montant) as total')
            ->groupBy('families.classe_id')
            ->pluck('total', 'classe_id');

        $classeIds = collect($souscriptionsParClasse->keys())
            ->merge($paiementsParClasse->keys())
            ->unique()
            ->values();

        if ($classeIds->isEmpty()) {
            return ['rang' => null, 'total_classes' => 0, 'classes' => []];
        }

        $classesNoms = Classe::query()->whereIn('id', $classeIds)->pluck('nom', 'id');

        $rows = $classeIds->map(function ($id) use ($souscriptionsParClasse, $paiementsParClasse, $classesNoms) {
            $cible = (int) ($souscriptionsParClasse[$id] ?? 0);
            $paye = (int) ($paiementsParClasse[$id] ?? 0);

            return [
                'classe_id' => (int) $id,
                'classe' => $classesNoms[$id] ?? 'Classe supprimée',
                'montant_cible' => $cible,
                'montant_paye' => $paye,
                'taux_recouvrement' => $cible > 0 ? min(100, round(($paye / $cible) * 100, 1)) : 0,
            ];
        })
            ->sortByDesc('taux_recouvrement')
            ->values()
            ->map(function (array $row, int $index) {
                $row['rang'] = $index + 1;

                return $row;
            });

        $courante = $rows->firstWhere('classe_id', $classeId);

        return [
            'rang' => $courante['rang'] ?? null,
            'total_classes' => $rows->count(),
            'classes' => $rows->values(),
        ];
    }

    /**
     * Rang d'UNE classe parmi toutes les classes, sur 3 critères FIMECO, sans jamais
     * exposer le nom ou les montants des autres classes (portée Point Focal FIMECO :
     * il ne doit voir que sa propre position, pas le détail des autres classes).
     */
    public function rangPourClasse(int $annee, ?int $classeId): array
    {
        $empty = [
            'total_classes' => 0,
            'rang_montant_souscrit' => null,
            'rang_taux_recouvrement' => null,
            'rang_nombre_souscripteurs' => null,
        ];

        $fimecoCotisationIds = Cotisation::query()
            ->whereRaw('LOWER(nom) LIKE ?', ['%fimeco%'])
            ->pluck('id');

        $souscriptionsParClasse = FimecoSouscription::query()
            ->where('fimeco_souscriptions.annee', $annee)
            ->whereNotNull('fimeco_souscriptions.family_id')
            ->join('families', 'families.id', '=', 'fimeco_souscriptions.family_id')
            ->whereNotNull('families.classe_id')
            ->selectRaw(
                'families.classe_id as classe_id,'
                . ' SUM(fimeco_souscriptions.montant_souscrit) as total_souscrit,'
                . ' SUM(CASE WHEN fimeco_souscriptions.montant_souscrit > 0 THEN 1 ELSE 0 END) as nb_souscripteurs'
            )
            ->groupBy('families.classe_id')
            ->get()
            ->keyBy('classe_id');

        $paiementsParClasse = Paiement::query()
            ->whereIn('paiements.cotisation_id', $fimecoCotisationIds)
            ->where('paiements.year', $annee)
            ->whereNotNull('paiements.family_id')
            ->join('families', 'families.id', '=', 'paiements.family_id')
            ->whereNotNull('families.classe_id')
            ->selectRaw('families.classe_id as classe_id, SUM(paiements.montant) as total')
            ->groupBy('families.classe_id')
            ->pluck('total', 'classe_id');

        $classeIds = collect($souscriptionsParClasse->keys())
            ->merge($paiementsParClasse->keys())
            ->unique()
            ->values();

        if ($classeIds->isEmpty()) {
            return $empty;
        }

        $rows = $classeIds->map(function ($id) use ($souscriptionsParClasse, $paiementsParClasse) {
            $s = $souscriptionsParClasse->get($id);
            $cible = (int) ($s->total_souscrit ?? 0);
            $paye = (int) ($paiementsParClasse[$id] ?? 0);

            return [
                'classe_id' => (int) $id,
                'montant_souscrit' => $cible,
                'nombre_souscripteurs' => (int) ($s->nb_souscripteurs ?? 0),
                'taux_recouvrement' => $cible > 0 ? min(100, round(($paye / $cible) * 100, 1)) : 0,
            ];
        });

        $rangSur = function (Collection $rows, string $field) use ($classeId) {
            $sorted = $rows->sortByDesc($field)->values();
            $index = $sorted->search(fn (array $row) => $row['classe_id'] === $classeId);

            return $index === false ? null : $index + 1;
        };

        return [
            'total_classes' => $rows->count(),
            'rang_montant_souscrit' => $rangSur($rows, 'montant_souscrit'),
            'rang_taux_recouvrement' => $rangSur($rows, 'taux_recouvrement'),
            'rang_nombre_souscripteurs' => $rangSur($rows, 'nombre_souscripteurs'),
        ];
    }
}
