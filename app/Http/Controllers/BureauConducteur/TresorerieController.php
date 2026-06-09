<?php

namespace App\Http\Controllers\BureauConducteur;

use App\Http\Controllers\Controller;
use App\Models\ActeLiturgique;
use App\Models\Classe;
use App\Models\Cotisation;
use App\Models\Don;
use App\Models\Family;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class TresorerieController extends Controller
{
    public function index()
    {
        if (!Schema::hasTable('paiements') || !Schema::hasTable('dons') || !Schema::hasTable('cotisations')) {
            return Inertia::render('BureauConducteur/Tresorerie/Index', [
                'globalStats' => [
                    'cotisationsTotales' => 0,
                    'cotisationsPayees' => 0,
                    'tauxPaiement' => 0,
                    'donsTotaux' => 0,
                    'cotisationsActives' => 0,
                    'famillesActives' => 0,
                ],
                'classes' => [],
                'cotisationsParClasse' => [],
            ]);
        }

        $classes = Classe::query()->orderBy('nom')->get();
        $families = Family::query()->get();

        $globalCotisationsTotales = (int) Paiement::query()->sum('montant');
        $donsTotaux = (int) Don::query()->sum('montant');
        $famillesActives = (int) $families->count();

        $classRows = $classes->map(function (Classe $classe) {
            $famillesClasse = Family::query()
                ->where('classe_id', $classe->id)
                ->select('id', 'nom', 'code_famille')
                ->get();

            $familyIds = $famillesClasse->pluck('id');
            $payeesByFamily = Paiement::query()
                ->whereIn('family_id', $familyIds)
                ->selectRaw('family_id, SUM(montant) as total')
                ->groupBy('family_id')
                ->pluck('total', 'family_id');

            $montantParFamille = 15000;
            $payeesTotal = (int) $payeesByFamily->sum();
            $expected = max(1, $famillesClasse->count()) * $montantParFamille;
            $taux = $expected > 0 ? round(($payeesTotal / $expected) * 100) : 0;

            $famillesList = $famillesClasse->map(function ($famille) use ($payeesByFamily, $montantParFamille) {
                $montantPaye = (int) $payeesByFamily->get($famille->id, 0);
                return [
                    'id'           => $famille->id,
                    'nom'          => $famille->nom,
                    'code_famille' => $famille->code_famille ?? null,
                    'montant_paye' => $montantPaye,
                    'solde'        => $montantPaye >= $montantParFamille,
                ];
            })->values()->toArray();

            return [
                'nom'          => $classe->nom,
                'taux'         => max(0, min(100, $taux)),
                'familles'     => $famillesClasse->count(),
                'cotisations'  => $expected,
                'payees'       => $payeesTotal,
                'famillesList' => $famillesList,
            ];
        })->values();

        $cotisationsParClasse = Cotisation::query()
            ->with(['classe:id,nom', 'creator:id,nom,prenom,role'])
            ->whereNotNull('classe_id')
            ->whereHas('creator', function ($query) {
                $query->where('role', 'conducteur');
            })
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('classe_id')
            ->map(function ($cotisations, $classeId) {
                $famillesClasse = Family::query()
                    ->where('classe_id', $classeId)
                    ->select('id', 'nom')
                    ->get();

                $familyIds = $famillesClasse->pluck('id')->values();
                $cotisationIds = $cotisations->pluck('id')->values();

                $paiementsQuery = Paiement::query()
                    ->whereIn('cotisation_id', $cotisationIds)
                    ->with(['family:id,nom', 'cotisation:id,nom', 'user:id,nom,prenom,classe_id'])
                    ->orderByDesc('date_paiement')
                    ->orderByDesc('id');

                if ($familyIds->isNotEmpty()) {
                    $paiementsQuery->where(function ($query) use ($familyIds, $classeId) {
                        $query->whereIn('family_id', $familyIds)
                            ->orWhereHas('user', function ($userQuery) use ($classeId) {
                                $userQuery->where('classe_id', $classeId);
                            });
                    });
                } else {
                    $paiementsQuery->whereHas('user', function ($userQuery) use ($classeId) {
                        $userQuery->where('classe_id', $classeId);
                    });
                }

                $paiements = $paiementsQuery->get();
                $totalPaye = (int) $paiements->sum('montant');

                $cotisationsRows = $cotisations
                    ->map(function (Cotisation $cotisation) use ($paiements) {
                        $totalCotisation = (int) $paiements
                            ->where('cotisation_id', $cotisation->id)
                            ->sum('montant');

                        return [
                            'id' => $cotisation->id,
                            'nom' => $cotisation->nom,
                            'montant' => (int) $cotisation->montant,
                            'periodicite' => $cotisation->periodicite,
                            'statut' => $cotisation->statut,
                            'createdBy' => trim((string) (($cotisation->creator?->prenom ?? '') . ' ' . ($cotisation->creator?->nom ?? ''))),
                            'createdAt' => optional($cotisation->created_at)->format('Y-m-d'),
                            'dateDebut' => optional($cotisation->date_debut)->format('Y-m-d'),
                            'dateFin' => optional($cotisation->date_fin)->format('Y-m-d'),
                            'dateEcheance' => optional($cotisation->date_echeance)->format('Y-m-d'),
                            'totalPaye' => $totalCotisation,
                        ];
                    })
                    ->values();

                $paiementsRows = $paiements
                    ->map(function (Paiement $paiement) {
                        return [
                            'id' => $paiement->id,
                            'cotisation' => $paiement->cotisation?->nom ?? '-',
                            'famille' => $paiement->family?->nom ?? '-',
                            'montant' => (int) $paiement->montant,
                            'date' => optional($paiement->date_paiement)->format('d/m/Y'),
                            'mode' => $paiement->mode_paiement,
                            'statut' => $paiement->payment_status ?? $paiement->statut,
                            'saisiPar' => trim((string) (($paiement->user?->prenom ?? '') . ' ' . ($paiement->user?->nom ?? ''))),
                        ];
                    })
                    ->values();

                $montantCibleTotal = (int) $cotisationsRows->sum('montant');

                return [
                    'classeId' => (int) $classeId,
                    'classeNom' => $cotisations->first()?->classe?->nom ?? 'Classe',
                    'familles' => $famillesClasse->count(),
                    'cotisationsCreees' => $cotisationsRows->count(),
                    'montantCibleTotal' => $montantCibleTotal,
                    'montantPayeTotal' => $totalPaye,
                    'tauxPaiement' => $montantCibleTotal > 0
                        ? max(0, min(100, round(($totalPaye / $montantCibleTotal) * 100)))
                        : 0,
                    'paiementsCount' => $paiementsRows->count(),
                    'cotisations' => $cotisationsRows,
                    'paiements' => $paiementsRows,
                ];
            })
            ->sortBy('classeNom')
            ->values();

        $cotisationsParClasseById = $cotisationsParClasse->keyBy(fn ($item) => (int) ($item['classeId'] ?? 0));

        $cotisationsParClasse = $classes
            ->map(function (Classe $classe) use ($cotisationsParClasseById) {
                return $cotisationsParClasseById->get($classe->id, [
                    'classeId' => (int) $classe->id,
                    'classeNom' => $classe->nom,
                    'familles' => (int) Family::query()->where('classe_id', $classe->id)->count(),
                    'cotisationsCreees' => 0,
                    'montantCibleTotal' => 0,
                    'montantPayeTotal' => 0,
                    'tauxPaiement' => 0,
                    'paiementsCount' => 0,
                    'cotisations' => [],
                    'paiements' => [],
                ]);
            })
            ->values();

        $cotisationsActives = Cotisation::query()
            ->where('statut', Cotisation::STATUT_ACTIVE)
            ->whereHas('creator', fn ($query) => $query->where('role', 'conducteur'))
            ->count();

        $globalTarget = (int) $classRows->sum('cotisations');

        $globalStats = [
            'cotisationsTotales' => max(0, $globalTarget),
            'cotisationsPayees' => max(0, $globalCotisationsTotales),
            'tauxPaiement' => $globalTarget > 0 ? round(($globalCotisationsTotales / $globalTarget) * 100) : 0,
            'donsTotaux' => max(0, $donsTotaux),
            'cotisationsActives' => $cotisationsActives,
            'famillesActives' => $famillesActives,
        ];

        $encouragements = ActeLiturgique::query()
            ->where('type_acte', 'generale')
            ->where('est_annonce', true)
            ->whereNull('family_id')
            ->whereNull('membre_id')
            ->where('created_by', Auth::id())
            ->latest()
            ->limit(20)
            ->get(['id', 'details', 'statut', 'created_at', 'created_by'])
            ->map(fn ($a) => [
                'id'         => $a->id,
                'message'    => $a->details['contenu'] ?? $a->details['message'] ?? '',
                'statut'     => $a->statut,
                'created_at' => optional($a->created_at)->format('d/m/Y H:i'),
            ]);

        return Inertia::render('BureauConducteur/Tresorerie/Index', [
            'globalStats'          => $globalStats,
            'classes'              => $classRows,
            'cotisationsParClasse' => $cotisationsParClasse,
            'encouragements'       => $encouragements,
        ]);
    }

    public function storeEncouragement(Request $request)
    {
        $request->validate([
            'message' => 'required|string|min:10|max:500',
        ]);

        ActeLiturgique::create([
            'type_acte'        => 'generale',
            'statut'           => 'PUBLIEE',
            'est_annonce'      => true,
            'details'          => [
                'titre'   => 'Encouragement cotisation',
                'contenu' => $request->message,
            ],
            'date_publication' => now(),
            'publiee_par'      => Auth::id(),
            'created_by'       => Auth::id(),
            'reference'        => 'ENC-' . now()->format('Ymd-His') . '-' . random_int(100, 999),
        ]);

        return redirect()
            ->route('bureau_conducteur.tresorerie.index')
            ->with('success', 'Encouragement publié dans le flash info !');
    }
}
