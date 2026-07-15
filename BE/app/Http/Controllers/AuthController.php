<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'nik' => 'required|string|size:16|unique:users',
            'name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'rt_id' => 'required|exists:rts,id',
            'block_id' => 'required|exists:blocks,id',
            'house_id' => 'required|exists:houses,id',
        ]);

        $user = User::create([
            'nik' => $request->nik,
            'name' => $request->name,
            'phone_number' => $request->phone_number,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => 8, // Warga
            'rt_id' => $request->rt_id,
            'block_id' => $request->block_id,
            'house_id' => $request->house_id,
            'is_approved' => false, // Harus di-approve RT
            'registration_status' => 'pending', // Harus lewat Sekretaris -> RT
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Registrasi berhasil. Silakan lengkapi profil Anda.',
            'data' => [
                'user' => $user->load('role', 'rt', 'block', 'house')
            ]
        ], 201);
    }
    public function login(Request $request)
    {
        \Log::info('Login attempt', $request->all());
        $request->validate([
            'email' => 'required',
            'password' => 'required',
        ]);

        $loginType = filter_var($request->email, FILTER_VALIDATE_EMAIL) ? 'email' : 'nik';

        if (Auth::attempt([$loginType => $request->email, 'password' => $request->password])) {
            $user = Auth::user();

            // Create token using Sanctum
            $token = $user->createToken('auth_token')->plainTextToken;
            
            return response()->json([
                'status' => 'success',
                'message' => 'Login berhasil',
                'data' => [
                    'user' => $user->load('role'),
                    'token' => $token,
                ]
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Email atau Password salah'
        ], 401);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Logout berhasil'
        ]);
    }
}
