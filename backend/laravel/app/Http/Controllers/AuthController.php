<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login user with username, password, and role validation
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
            'role'     => ['required', 'string', 'in:admin,inventory'],
        ]);

        // Find user by username
        $user = User::where('username', $validated['username'])->first();

        // Check if user exists and password matches
        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid username or password',
            ], 401);
        }

        // Check if user is active
        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Your account is not active. Please contact administrator.',
            ], 403);
        }

        // Super admin can login as any role
        $isSuperAdmin = $user->is_super_admin ?? false;
        
        if (!$isSuperAdmin) {
            // Verify role matches for regular users
            $userRole = strtolower($user->role);
            $requestedRole = strtolower($validated['role']);

            if ($userRole !== $requestedRole) {
                return response()->json([
                    'success' => false,
                    'message' => "You don't have permission to access as {$validated['role']}. Your role is: {$user->role}",
                ], 403);
            }
        }

        // Update last login
        $user->update(['last_login' => now()]);

        // Create session
        Auth::login($user);
        $request->session()->regenerate(); // Regenerate session ID for security
        Session::put('user_id', $user->id);
        Session::put('user_role', $user->role);
        Session::put('username', $user->username);
        Session::put('is_super_admin', $isSuperAdmin);

        // Determine redirect path based on selected role (super admin can choose any)
        $selectedRole = strtolower($validated['role']);
        $redirectPath = $selectedRole === 'admin' ? '/admin_user' : '/inventory_user';

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'full_name' => $user->full_name,
                    'role' => $user->role,
                    'is_super_admin' => $isSuperAdmin,
                ],
                'redirect' => $redirectPath,
            ],
        ]);
    }

    /**
     * Get current authenticated user
     */
    public function me(Request $request): JsonResponse
    {
        if (!Auth::check()) {
            return response()->json([
                'success' => false,
                'message' => 'Not authenticated',
            ], 401);
        }

        $user = Auth::user();
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'full_name' => $user->full_name,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        Session::flush();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }
}

