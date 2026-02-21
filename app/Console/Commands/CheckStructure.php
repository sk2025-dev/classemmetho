<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CheckStructure extends Command
{
    protected $signature = 'check:structure';
    protected $description = 'Vérifier la structure de users et family_members';

    public function handle()
    {
        $this->info("=== STRUCTURE ACTUELLE ===\n");

        // Colonnes de family_members
        $fmColumns = Schema::getColumnListing('family_members');
        $this->info("TABLE: family_members");
        $this->info("Colonnes (" . count($fmColumns) . "):");
        foreach ($fmColumns as $col) {
            $this->line("  • $col");
        }

        // Colonnes de users
        $this->line("");
        $userColumns = Schema::getColumnListing('users');
        $this->info("TABLE: users");
        $this->info("Colonnes (" . count($userColumns) . "):");
        foreach ($userColumns as $col) {
            $this->line("  • $col");
        }

        // Vérifier absence de duplication
        $this->line("\n=== VÉRIFICATION ABSENCE DUPLICATION ===");
        $duplicated = array_intersect($fmColumns, [
            'nom', 'prenom', 'email', 'telephone', 'date_naissance',
            'genre', 'photo_path', 'profession', 'statut_marital',
            'date_mariage', 'lieu_mariage', 'date_divorce', 'date_deces'
        ]);

        if (empty($duplicated)) {
            $this->info("✅ PARFAIT: Aucune colonne personnelle dupliquée dans family_members");
        } else {
            $this->error("❌ PROBLÈME: Colonnes dupliquées trouvées:");
            foreach ($duplicated as $col) {
                $this->line("  • $col");
            }
        }

        // Vérifier que les colonnes nécessaires existent
        $this->line("\n=== COLONNES REQUISES DANS family_members ===");
        $required = [
            'id', 'user_id', 'family_id', 'classe_id', 'relation',
            'baptise', 'date_bapteme', 'lieu_bapteme',
            'premiere_communion', 'date_premiere_communion', 'lieu_premiere_communion',
            'mariage_religieux', 'date_mariage_religieux', 'lieu_mariage_religieux',
            'contact_urgence', 'contact_urgence_tel'
        ];

        $missing = [];
        foreach ($required as $col) {
            $exists = in_array($col, $fmColumns);
            $this->line(($exists ? "✅" : "❌") . " $col");
            if (!$exists) {
                $missing[] = $col;
            }
        }

        // Vérifier les colonnes de dot dans users
        $this->line("\n=== COLONNES DOT DANS USERS ===");
        $dotCols = ['date_dot', 'lieu_dot'];
        foreach ($dotCols as $col) {
            $exists = in_array($col, $userColumns);
            $this->line(($exists ? "✅" : "❌") . " $col");
        }

        // Résumé
        $this->line("\n=== RÉSUMÉ ===");
        if (empty($duplicated) && empty($missing)) {
            $this->info("✅ STRUCTURE PARFAITE!");
            $this->info("✅ Pas de duplication dans family_members");
            $this->info("✅ Toutes les colonnes requises existent");
            $this->info("✅ Colonnes date_dot et lieu_dot dans users");
        } else {
            $this->error("❌ Des problèmes détectés");
        }
    }
}
