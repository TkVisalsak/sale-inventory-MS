<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if super admin already exists
        $superAdmin = User::where('username', 'superadmin')->first();

        if (!$superAdmin) {
            User::create([
                'username' => 'superadmin',
                'email' => 'superadmin@salesystem.com',
                'password' => Hash::make('superadmin123'), // Change this password!
                'full_name' => 'Super Administrator',
                'role' => 'admin', // Default role, but can login as any
                'status' => 'active',
                'is_super_admin' => true,
                'department' => 'Administration',
            ]);

            $this->command->info('Super Admin created successfully!');
            $this->command->warn('Username: superadmin');
            $this->command->warn('Password: superadmin123');
            $this->command->warn('⚠️  Please change the password after first login!');
        } else {
            $this->command->info('Super Admin already exists.');
        }
    }
}

