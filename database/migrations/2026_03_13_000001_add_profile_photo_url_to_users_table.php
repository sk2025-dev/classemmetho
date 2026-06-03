<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Ajoute la colonne profile_photo_url manquante à la table users.
     * La migration 2026_02_16_optimize_photo_storage a supprimé photo_url
     * en supposant que profile_photo_url existait déjà, mais elle n'a jamais
     * été ajoutée. Ce correctif la crée et backfille les données depuis photo_path.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = Schema::getColumnListing('users');
            if (!in_array('profile_photo_url', $columns)) {
                $table->string('profile_photo_url')->nullable()->after('photo_path');
            }
        });

        // Backfill: pour chaque user ayant un photo_path, construire l'URL relative
        DB::table('users')
            ->whereNotNull('photo_path')
            ->where('photo_path', '!=', '')
            ->whereNull('profile_photo_url')
            ->chunkById(100, function ($users) {
                foreach ($users as $user) {
                    $path = $user->photo_path;
                    // Normaliser vers /storage/... (relatif, jamais absolu)
                    if (str_starts_with($path, '/storage/')) {
                        $relativeUrl = $path;
                    } elseif (str_starts_with($path, 'storage/')) {
                        $relativeUrl = '/' . $path;
                    } elseif (str_starts_with($path, 'public/')) {
                        $relativeUrl = '/storage/' . ltrim(substr($path, 7), '/');
                    } elseif (str_starts_with($path, 'http')) {
                        // URL absolue — extraire la partie /storage/...
                        if (str_contains($path, '/storage/')) {
                            $pos = strpos($path, '/storage/');
                            $relativeUrl = substr($path, $pos);
                        } else {
                            continue;
                        }
                    } else {
                        $relativeUrl = '/storage/' . ltrim($path, '/');
                    }

                    DB::table('users')->where('id', $user->id)->update([
                        'profile_photo_url' => $relativeUrl,
                    ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = Schema::getColumnListing('users');
            if (in_array('profile_photo_url', $columns)) {
                $table->dropColumn('profile_photo_url');
            }
        });
    }
};
