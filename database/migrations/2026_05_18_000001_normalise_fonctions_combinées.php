<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Récupérer toutes les fonctions ──────────────────────────────
        $allFonctions = DB::table('fonctions')->get()->keyBy('id');

        // ── 2. Identifier les fonctions combinées (contiennent une virgule) ─
        $combined = $allFonctions->filter(fn($f) => str_contains($f->nom, ','));

        if ($combined->isEmpty()) {
            return; // Rien à faire
        }

        // ── 3. Pour chaque fonction combinée, résoudre les parties ─────────
        $resolvedParts = []; // [combined_id => [individual_id, ...]]

        foreach ($combined as $combinedFonction) {
            $parts = array_map('trim', explode(',', $combinedFonction->nom));
            $partIds = [];

            foreach ($parts as $partName) {
                if (empty($partName)) continue;

                // Cherche case-insensitive dans les fonctions existantes
                $existing = $allFonctions->first(
                    fn($f) => mb_strtolower(trim($f->nom)) === mb_strtolower($partName)
                );

                if ($existing) {
                    $partIds[] = $existing->id;
                } else {
                    // Créer la fonction individuelle manquante
                    $newId = DB::table('fonctions')->insertGetId([
                        'nom'         => ucfirst(trim($partName)),
                        'description' => null,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]);
                    // Recharger pour les prochaines itérations
                    $newFonction = DB::table('fonctions')->find($newId);
                    $allFonctions->put($newId, $newFonction);
                    $partIds[] = $newId;
                }
            }

            $resolvedParts[$combinedFonction->id] = array_unique($partIds);
        }

        // ── 4. Migrer les liens dans fonction_user ─────────────────────────
        foreach ($resolvedParts as $combinedId => $individualIds) {
            // Trouver tous les users liés à cette fonction combinée
            $links = DB::table('fonction_user')
                ->where('fonction_id', $combinedId)
                ->get();

            foreach ($links as $link) {
                foreach ($individualIds as $indivId) {
                    // Insérer le lien individuel (ignorer les doublons)
                    $exists = DB::table('fonction_user')
                        ->where('user_id', $link->user_id)
                        ->where('fonction_id', $indivId)
                        ->exists();

                    if (!$exists) {
                        DB::table('fonction_user')->insert([
                            'user_id'    => $link->user_id,
                            'fonction_id'=> $indivId,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
                // Supprimer le lien combiné
                DB::table('fonction_user')->where('id', $link->id)->delete();
            }
        }

        // ── 5. Migrer users.fonction_id (FK directe) ──────────────────────
        foreach ($resolvedParts as $combinedId => $individualIds) {
            if (empty($individualIds)) continue;

            // Mettre à jour les users dont fonction_id pointe vers le combiné
            // → on prend la première fonction individuelle comme valeur principale
            DB::table('users')
                ->where('fonction_id', $combinedId)
                ->update(['fonction_id' => $individualIds[0]]);
        }

        // ── 6. Supprimer les fonctions combinées ───────────────────────────
        DB::table('fonctions')
            ->whereIn('id', $combined->pluck('id')->all())
            ->delete();
    }

    public function down(): void
    {
        // Irréversible : la migration ne peut pas recréer les combinaisons originales
    }
};
