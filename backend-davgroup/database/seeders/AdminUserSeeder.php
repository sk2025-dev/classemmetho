<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Create or update the admin account used by the frontend login.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@davgroup.com')],
            [
                'name' => env('ADMIN_NAME', 'Administrateur DAVGROUP'),
                'email_verified_at' => now(),
                'password' => Hash::make(env('ADMIN_PASSWORD', 'Admin@2026')),
            ],
        );
    }
}
