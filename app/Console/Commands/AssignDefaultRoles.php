<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class AssignDefaultRoles extends Command
{
    protected $signature = 'app:assign-default-roles';
    protected $description = 'Assign default roles to users based on email or assignment';

    public function handle()
    {
        $users = User::whereNull('role')
            ->orWhere('role', '')
            ->get();

        $this->info("Found " . $users->count() . " users without roles");

        foreach ($users as $user) {
            // Chercher si c'est un admin (première lettre ou une email spécifique)
            if (str_contains(strtolower($user->email), 'admin') ||
                str_contains(strtolower($user->email), 'pasteur') ||
                $user->id === 1) {
                $user->role = 'admin';
                $this->line("✓ {$user->email} → admin");
            } else {
                // Par défaut, member de famille
                $user->role = 'membre_famille';
                $this->line("✓ {$user->email} → membre_famille");
            }
            $user->save();
        }

        // Afficher tous les utilisateurs avec leurs rôles
        $this->line("\n=== All Users ===");
        User::all()->each(function ($u) {
            $this->line("{$u->id}: {$u->prenom} {$u->nom} ({$u->email}) - Role: {$u->role}");
        });

        $this->info("✓ All users have been assigned roles!");
    }
}
