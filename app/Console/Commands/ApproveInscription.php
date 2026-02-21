<?php

namespace App\Console\Commands;

use App\Models\Inscription;
use Illuminate\Console\Command;

class ApproveInscription extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inscriptions:approve
                            {id : ID de l\'inscription}
                            {--admin : Approuver en tant qu\'admin}
                            {--conductor : Approuver en tant que conducteur}
                            {--reason= : Raison de l\'approbation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Approuver une inscription via la ligne de commande';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $id = $this->argument('id');
        $inscription = Inscription::find($id);

        if (!$inscription) {
            $this->error("Inscription #{$id} non trouvée");
            return self::FAILURE;
        }

        if (!$this->option('admin') && !$this->option('conductor')) {
            $this->error('Vous devez spécifier --admin ou --conductor');
            return self::FAILURE;
        }

        // Récupérer un utilisateur avec le rôle approprié
        if ($this->option('admin')) {
            $approver = \App\Models\User::where('role', 'admin')->first();
            if (!$approver) {
                $this->error('Aucun utilisateur admin trouvé');
                return self::FAILURE;
            }

            $service = app(\App\Services\InscriptionApprovalService::class);
            $service->approve($inscription, $approver, 'admin', $this->option('reason'));
            $this->info('✓ Inscription approuvée par l\'admin');
        }

        if ($this->option('conductor')) {
            $approver = \App\Models\User::where('role', 'conducteur')->first();
            if (!$approver) {
                $this->error('Aucun utilisateur conducteur trouvé');
                return self::FAILURE;
            }

            $service = app(\App\Services\InscriptionApprovalService::class);
            $service->approve($inscription, $approver, 'conducteur', $this->option('reason'));
            $this->info('✓ Inscription approuvée par le conducteur');

            // Vérifier si maintenant elle est complètement approuvée
            $inscription->refresh();
            if ($inscription->status === 'approuve') {
                $this->info('✓ Les deux approbations sont complètes!');
                $this->info('✓ Les FamilyMembers ont été créés automatiquement');
            }
        }

        return self::SUCCESS;
    }
}
