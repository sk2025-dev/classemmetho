<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Family;

class FixDuplicateFamilies extends Command
{
    protected $signature = 'family:fix-duplicates';
    protected $description = 'Nettoie les familles dupliquées avant la migration';

    public function handle()
    {
        $this->info('🔍 Recherche des familles dupliquées...');

        $dupes = Family::select('email', 'classe_id', DB::raw('COUNT(*) as cnt'), DB::raw('MIN(id) as keep_id'))
            ->whereNotNull('email')
            ->groupBy('email', 'classe_id')
            ->having('cnt', '>', 1)
            ->get();

        if ($dupes->isEmpty()) {
            $this->info('✅ Aucun doublon trouvé!');
            return;
        }

        $this->info("⚠️  {$dupes->count()} groupes de doublons trouvés\n");

        foreach ($dupes as $group) {
            $this->line("📧 Email: <fg=blue>{$group->email}</>, Classe: <fg=blue>{$group->classe_id}</>");

            // Trouver et supprimer les doublons
            $duplicates = Family::where('email', $group->email)
                ->where('classe_id', $group->classe_id)
                ->where('id', '!=', $group->keep_id)
                ->get();

            foreach ($duplicates as $fam) {
                $this->line("  └─ Suppression famille #{$fam->id}");

                // SOFTDELETE d'abord les family_members de la famille dupliquée
                // pour éviter le conflit UNIQUE
                DB::table('family_members')
                    ->where('family_id', $fam->id)
                    ->update(['deleted_at' => now()]);

                // Rediriger les users
                $userCount = DB::table('users')
                    ->where('family_id', $fam->id)
                    ->update(['family_id' => $group->keep_id]);

                $this->line("     └─ $userCount users redirigés");

                // Soft delete la famille (pas forceDelete)
                $fam->delete();
            }
        }

        $this->newLine();
        $this->info('✅ Nettoyage des doublons terminé!');
    }
}
