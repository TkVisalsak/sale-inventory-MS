# Super Admin Account Setup

## Overview
A super admin account has been created that can login with **any role** (admin or inventory), bypassing normal role restrictions.

## Setup Instructions

### 1. Run the Migration
Add the `is_super_admin` column to the users table:
```bash
php artisan migrate
```

### 2. Create the Super Admin User
Run the seeder to create the super admin account:
```bash
php artisan db:seed --class=SuperAdminSeeder
```

Or seed all seeders:
```bash
php artisan db:seed
```

## Super Admin Credentials

**⚠️ IMPORTANT: Change these credentials after first login!**

- **Username:** `superadmin`
- **Password:** `superadmin123`
- **Email:** `superadmin@salesystem.com`

## How It Works

1. The super admin account has `is_super_admin = true` in the database
2. When logging in, the system checks if the user is a super admin
3. If super admin, they can select **any role** (admin or inventory) regardless of their assigned role
4. Regular users must match their assigned role

## Security Notes

- **Change the default password immediately** after first login
- The super admin can access both admin and inventory dashboards
- Use this account only for system administration and troubleshooting
- Consider restricting super admin access to specific IP addresses if needed

## Manual Creation (Alternative)

If you prefer to create the super admin manually via database:

```sql
INSERT INTO users (username, email, password, full_name, role, status, is_super_admin, department, created_at, updated_at)
VALUES (
    'superadmin',
    'superadmin@salesystem.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: superadmin123
    'Super Administrator',
    'admin',
    'active',
    true,
    'Administration',
    NOW(),
    NOW()
);
```

## Testing

1. Go to `/login`
2. Enter username: `superadmin`
3. Enter password: `superadmin123`
4. Select **either** "Admin" or "Inventory" role
5. You should be able to login successfully with either role selection

