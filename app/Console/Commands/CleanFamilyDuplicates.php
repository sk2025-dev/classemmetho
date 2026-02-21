<?php

namespace App\Console\Commands;

use App\Services\FamilyDeduplicationService;
use Illuminate\Console\Command;

class CleanFamilyDuplicates extends Command
{
    protected $signature = 'family:clean-duplicates {--verify-only : Vérifier seulement sans corriger}';
    protected $description = 'Nettoie les familles dupliquées et fixe les intégrités';

    public function handle()
    {
        $verifyOnly = $this->option('verify-only');
        $service = new FamilyDeduplicationService();

        $this->info('🔍 Recherche des familles dupliquées...');

        $stats = $service->cleanAllDuplicates();

        $this->newLine();
        $this->info('📊 Résultats:');
        $this->line("   • Groupes dupliqués trouvés: {$stats['duplicate_groups']}");
        $this->line("   • Familles fusionnées: {$stats['families_merged']}");
        $this->line("   • FamilyMembers redirigés: {$stats['family_members_updated']}");
        $this->line("   • Users redirigés: {$stats['users_updated']}");

        if (!empty($stats['errors'])) {
            $this->newLine();
            $this->error('❌ Erreurs:');
            foreach ($stats['errors'] as $error) {
                $this->line("   • {$error}");
            }
        }

        $this->newLine();
        $this->info('✅ Nettoyage des doublons terminé!');
    }
}
