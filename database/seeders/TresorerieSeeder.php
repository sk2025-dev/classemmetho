<?php

namespace Database\Seeders;

use App\Models\Campagne;
use App\Models\Classe;
use App\Models\Cotisation;
use App\Models\Don;
use App\Models\Family;
use App\Models\Paiement;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class TresorerieSeeder extends Seeder
{
    public function run(): void
    {
        if (Family::query()->count() === 0) {
            $this->command?->warn('TresorerieSeeder ignoré: aucune famille trouvée.');
            return;
        }

        DB::transaction(function () {
            $this->seedCotisations();
            $this->seedCampagnes();
            $this->seedPaiementsEtDons();
        });

        $this->command?->info('TresorerieSeeder exécuté avec succès.');
    }

    private function seedCotisations(): void
    {
        $defaults = [
            [
                'nom' => 'FIMECO',
                'montant' => 15000,
                'periodicite' => Cotisation::PERIODICITE_MENSUEL,
                'statut' => Cotisation::STATUT_ACTIVE,
                'target_scope' => Cotisation::TARGET_SCOPE_FAMILLE,
                'description' => 'Contribution mensuelle familiale',
            ],
            [
                'nom' => 'Affiliation CEMEC',
                'montant' => 50000,
                'periodicite' => Cotisation::PERIODICITE_ANNUEL,
                'statut' => Cotisation::STATUT_ACTIVE,
                'target_scope' => Cotisation::TARGET_SCOPE_FAMILLE,
                'description' => 'Cotisation annuelle CEMEC',
            ],
            [
                'nom' => 'Cotisation paroissiale',
                'montant' => 10000,
                'periodicite' => Cotisation::PERIODICITE_MENSUEL,
                'statut' => Cotisation::STATUT_ACTIVE,
                'target_scope' => Cotisation::TARGET_SCOPE_FAMILLE,
                'description' => 'Soutien mensuel paroissial',
            ],
        ];

        foreach ($defaults as $item) {
            Cotisation::query()->firstOrCreate(
                ['nom' => $item['nom'], 'classe_id' => null],
                $item + ['date_debut' => now()->startOfYear()->toDateString()]
            );
        }

        $classIds = Classe::query()->pluck('id');
        foreach ($classIds as $classId) {
            Cotisation::query()->firstOrCreate(
                ['nom' => 'Collecte spéciale classe', 'classe_id' => $classId],
                [
                    'montant' => 5000,
                    'periodicite' => Cotisation::PERIODICITE_MENSUEL,
                    'statut' => Cotisation::STATUT_ACTIVE,
                    'target_scope' => Cotisation::TARGET_SCOPE_FAMILLE,
                    'description' => 'Collecte mensuelle propre à la classe',
                    'date_debut' => now()->startOfYear()->toDateString(),
                ]
            );

            Cotisation::query()->firstOrCreate(
                ['nom' => 'Cotisation individuelle classe', 'classe_id' => $classId],
                [
                    'montant' => 3000,
                    'periodicite' => Cotisation::PERIODICITE_MENSUEL,
                    'statut' => Cotisation::STATUT_ACTIVE,
                    'target_scope' => Cotisation::TARGET_SCOPE_INDIVIDUELLE,
                    'description' => 'Cotisation individuelle des membres de la classe',
                    'date_debut' => now()->startOfYear()->toDateString(),
                ]
            );
        }
    }

    private function seedCampagnes(): void
    {
        Campagne::query()->firstOrCreate(
            ['titre' => 'Rénovation temple'],
            [
                'objectif_montant' => 5000000,
                'montant_collecte' => 3200000,
                'scope' => Campagne::SCOPE_GLOBAL,
                'statut' => Campagne::STATUT_ACTIVE,
                'date_debut' => now()->subMonths(4)->toDateString(),
                'date_fin' => now()->addMonths(2)->toDateString(),
            ]
        );

        $classe = Classe::query()->first();
        if ($classe) {
            Campagne::query()->firstOrCreate(
                ['titre' => 'Achat matériel ' . $classe->nom],
                [
                    'objectif_montant' => 1000000,
                    'montant_collecte' => 450000,
                    'scope' => Campagne::SCOPE_CLASSE,
                    'classe_id' => $classe->id,
                    'statut' => Campagne::STATUT_ACTIVE,
                    'date_debut' => now()->subMonths(2)->toDateString(),
                    'date_fin' => now()->addMonths(1)->toDateString(),
                ]
            );
        }
    }

    private function seedPaiementsEtDons(): void
    {
        $families = Family::query()->with('users')->get();
        $cotisations = Cotisation::query()->where('statut', Cotisation::STATUT_ACTIVE)->get();
        $campagnes = Campagne::query()->where('statut', Campagne::STATUT_ACTIVE)->get();

        foreach ($families as $family) {
            $member = $family->users->first();
            $mode = [
                Paiement::MODE_MOBILE_MONEY,
                Paiement::MODE_ESPECES,
                Paiement::MODE_VIREMENT,
            ][($family->id % 3)];

            foreach ($cotisations->take(2) as $index => $cotisation) {
                Paiement::query()->firstOrCreate(
                    [
                        'reference_recu' => sprintf('RECU-%d-%d-%d', $family->id, $cotisation->id, $index + 1),
                    ],
                    [
                        'family_id' => $family->id,
                        'user_id' => $member?->id,
                        'cotisation_id' => $cotisation->id,
                        'montant' => (int) $cotisation->montant,
                        'mode_paiement' => $mode,
                        'date_paiement' => Carbon::now()->subDays(($family->id + $index) % 20)->toDateString(),
                        'statut' => Paiement::STATUT_PAYE,
                        'note' => 'Paiement seedé automatiquement',
                    ]
                );
            }

            $campagne = $campagnes->first();
            if ($campagne) {
                Don::query()->firstOrCreate(
                    [
                        'reference_recu' => sprintf('DON-%d-%d', $family->id, $campagne->id),
                    ],
                    [
                        'family_id' => $family->id,
                        'user_id' => $member?->id,
                        'campagne_id' => $campagne->id,
                        'montant' => 5000 + (($family->id % 6) * 5000),
                        'type' => Don::TYPE_CAMPAGNE,
                        'mode_paiement' => $mode,
                        'date_don' => Carbon::now()->subDays($family->id % 15)->toDateString(),
                        'note' => 'Don seedé automatiquement',
                    ]
                );
            }
        }

        foreach ($campagnes as $campagne) {
            $total = (int) Don::query()
                ->when($campagne->scope === Campagne::SCOPE_CLASSE, function ($query) use ($campagne) {
                    $query->where('campagne_id', $campagne->id);
                }, function ($query) {
                    $query->whereNotNull('campagne_id');
                })
                ->sum('montant');

            $campagne->update(['montant_collecte' => max($campagne->montant_collecte, $total)]);
        }
    }
}
