<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Inscription;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class FixMissingPhotoPaths extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'photos:fix-missing-paths';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Corrige les photos manquantes dans les inscriptions en se basant sur les fichiers existants';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Recherche des inscriptions avec photos dans le storage mais sans路径 en base de données...');

        // Chercher les inscriptions qui ont des photos dans le storage
        $inscriptions = Inscription::whereNull('photo_path')
            ->orWhere('photo_path', '')
            ->get();

        $fixed = 0;
        $notFound = 0;

        foreach ($inscriptions as $inscription) {
            // Chercher les photos dans le storage
            $files = Storage::disk('public')->files('inscriptions');
            
            // Chercher une photo qui correspond à l'inscription
            // On cherche des fichiers avec le format: inscription_{hash}_{id}.{ext}
            $foundPhoto = null;
            
            foreach ($files as $file) {
                // Extraire le timestamp du nom de fichier
                $filename = basename($file);
                if (preg_match('/inscription_[a-f0-9]+_(\d+)\./', $filename, $matches)) {
                    // Ce fichier a été créé autour du moment de l'inscription
                    // Vérifier si c'est proche de la date de création de l'inscription
                    $fileTimestamp = (int)$matches[1];
                    $inscriptionTimestamp = $inscription->created_at->timestamp;
                    
                    // Si la différence est inférieure à 1 jour (86400 secondes)
                    if (abs($fileTimestamp - $inscriptionTimestamp) < 86400) {
                        $foundPhoto = $file;
                        break;
                    }
                }
            }

            if ($foundPhoto) {
                $photoUrl = asset('storage/' . $foundPhoto);
                
                $inscription->update([
                    'photo_path' => $foundPhoto,
                    'profile_photo_url' => $photoUrl,
                ]);

                $this->info("✅ Inscription #{$inscription->id}: Photo corrigée - {$foundPhoto}");
                $fixed++;
            } else {
                $notFound++;
            }
        }

        $this->info("📊 Résumé: {$fixed} photos corrigées, {$notFound} non trouvées");
        
        // Essayer une autre approche: chercher par nom/email
        if ($fixed === 0) {
            $this->info('🔍 Essai avec une autre approche...');
            
            $inscriptions = Inscription::where(function($q) {
                $q->whereNull('photo_path')
                  ->orWhere('photo_path', '');
            })->get();

            foreach ($inscriptions as $inscription) {
                $nom = strtolower($inscription->responsable_nom ?? $inscription->nom ?? '');
                $prenom = strtolower($inscription->responsable_prenom ?? $inscription->prenom ?? '');
                
                // Chercher des fichiers avec le nom
                $files = Storage::disk('public')->files('inscriptions');
                
                foreach ($files as $file) {
                    $filename = basename($file);
                    // Chercher par timestamp proche de la création
                    if (preg_match('/inscription_([a-f0-9]+)_(\d+)\./', $filename, $matches)) {
                        $fileTimestamp = (int)$matches[1];
                        $inscriptionTimestamp = $inscription->created_at->timestamp;
                        
                        if (abs($fileTimestamp - $inscriptionTimestamp) < 86400 * 7) { // 7 jours
                            $photoUrl = asset('storage/' . $file);
                            
                            $inscription->update([
                                'photo_path' => $file,
                                'profile_photo_url' => $photoUrl,
                            ]);
                            
                            $this->info("✅ Inscription #{$inscription->id}: Photo corrigée (par timestamp) - {$file}");
                            $fixed++;
                            break;
                        }
                    }
                }
            }
            
            $this->info("📊 Résultat final: {$fixed} photos corrigées au total");
        }

        return 0;
    }
}
