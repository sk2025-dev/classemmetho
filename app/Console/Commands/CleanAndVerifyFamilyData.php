<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Family;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CleanAndVerifyFamilyData extends Command
{
    protected $signature = 'family:clean-and-verify';
    protected $description = 'Nettoie et vérifie l\'intégrité des données de famille';

    public function handle()
    {
        $this->info('🔍 Vérification et nettoyage des données de famille...');

        // Vérifier les responsables de famille
        $this->verifyFamilyResponsibles();

        // 3. Vérifier les responsables de famille
        $this->verifyFamilyResponsibles();

        // 4. Afficher les statistiques
        $this->showStatistics();

        $this->info('✅ Nettoyage et vérification terminés!');
    }

    /**
     * Vérifier les responsables de famille
     */
    private function verifyFamilyResponsibles()
    {
        $this->line('👨‍💼 Vérification des responsables de famille...');

        $families = Family::all();
        $fixed = 0;

        foreach ($families as $family) {
            if (!$family->responsable_id) {
                // Trouver le user responsable (id = family_id signifie responsable)
                $responsable = User::where('family_id', $family->id)
                    ->where('role', 'responsable_famille')
                    ->first();

                if ($responsable) {
                    $family->update(['responsable_id' => $responsable->id]);
                    $fixed++;
                }
            }
        }

        $this->info("✓ {$fixed} responsable(s) corrigé(s)");
    }

    /**
     * Afficher les statistiques
     */
    private function showStatistics()
    {
        $this->line("\n📊 Statistiques:");

        $totalFamilies = Family::count();
        $totalMembers = FamilyMember::count();
        $totalUsers = User::count();
        $usersWithFamily = User::whereNotNull('family_id')->count();

        $this->info("  • Familles: {$totalFamilies}");
        $this->info("  • FamilyMembers: {$totalMembers}");
        $this->info("  • Utilisateurs totaux: {$totalUsers}");
        $this->info("  • Utilisateurs avec famille: {$usersWithFamily}");

        // Familles par responsable
        $familiesPerResponsible = Family::groupBy('responsable_id')
            ->selectRaw('responsable_id, COUNT(*) as count')
            ->get();

        $this->line("\n👨‍💼 Responsables de famille:");
        foreach ($familiesPerResponsible as $item) {
            if ($item->responsable_id) {
                $user = User::find($item->responsable_id);
                $this->info("  • {$user->nom} {$user->prenom}: {$item->count} famille(s)");
            }
        }
    }
}
