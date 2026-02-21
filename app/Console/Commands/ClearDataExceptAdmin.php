<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Family;
use App\Models\UserSacrement;
use App\Models\Inscription;
use App\Models\Classe;
use App\Models\Ville;
use App\Models\Fonction;
use App\Models\LoginHistory;
use App\Models\Notification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ClearDataExceptAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:clear-data-except-admin {--confirm : Skip confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear all database data except the super admin user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->option('confirm') && !$this->confirm('This will delete ALL data except the super admin user. Are you sure?')) {
            $this->info('Operation cancelled.');
            return;
        }

        $this->info('Starting database cleanup...');

        DB::beginTransaction();

        try {
            // Find the super admin user
            $admin = User::where('email', 'admin@classemetho.local')->first();

            if (!$admin) {
                $this->error('Super admin user not found! Aborting.');
                return;
            }

            $this->info("Preserving super admin user: {$admin->email}");

            // Clear tables in order to avoid foreign key constraints
            // Start with tables that have foreign keys pointing to users

            // Clear login histories (except admin's)
            LoginHistory::where('user_id', '!=', $admin->id)->delete();
            $this->info('Cleared login histories');

            // Clear notifications (except admin's)
            Notification::where('user_id', '!=', $admin->id)->delete();
            $this->info('Cleared notifications');

            // Clear user sacraments (except admin's)
            UserSacrement::where('user_id', '!=', $admin->id)->delete();
            $this->info('Cleared user sacraments');

            // Clear inscriptions
            Inscription::query()->delete();
            $this->info('Cleared inscriptions');

            // Clear families (this will cascade to family members)
            Family::query()->delete();
            $this->info('Cleared families');

            // Clear users except admin
            User::where('id', '!=', $admin->id)->delete();
            $this->info('Cleared users (except admin)');

            // Clear other reference tables if needed
            // Note: Keep classes, villes, fonctions as they are reference data
            // Classe::truncate(); // Uncomment if you want to clear classes too
            // Ville::truncate(); // Uncomment if you want to clear villes too
            // Fonction::truncate(); // Uncomment if you want to clear fonctions too

            DB::commit();

            $this->info('Database cleanup completed successfully!');
            $this->info("Super admin user preserved: {$admin->email}");

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Error during cleanup: ' . $e->getMessage());
            throw $e;
        }
    }
}
