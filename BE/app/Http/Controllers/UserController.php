<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with(['role', 'rt', 'block', 'house.block', 'religion', 'maritalStatus', 'professionCategory'])->latest()->get();
        return response()->json([
            'status' => 'success',
            'data' => $users
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nik' => 'nullable|string|unique:users',
            'name' => 'required|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:users',
            'password' => 'nullable|string|min:8',
            'phone_number' => 'nullable|string|max:20',
            'role_id' => 'required|exists:roles,id',
            'rt_id' => 'nullable|exists:rts,id',
            'block_id' => 'nullable|exists:blocks,id',
            'house_number' => 'nullable|string|max:10',
            'religion_id' => 'nullable|exists:religions,id',
            'marital_status_id' => 'nullable|exists:marital_statuses,id',
            'profession_category_id' => 'nullable|exists:profession_categories,id',
        ]);

        $currentUser = auth()->user();
        if (in_array($currentUser->role_id, [4, 6])) {
            return response()->json(['message' => 'Sekretaris tidak memiliki akses untuk menambah akun'], 403);
        }
        if ($currentUser->role_id == 2 && !in_array($validated['role_id'], [3, 4, 5])) {
            return response()->json(['message' => 'Ketua RW hanya dapat membuat akun Sekretaris RW, Bendahara RW, atau Ketua RT'], 403);
        }
        if ($currentUser->role_id == 3 && !in_array($validated['role_id'], [6, 7, 8])) {
            return response()->json(['message' => 'Ketua RT hanya dapat membuat akun Sekretaris RT, Bendahara RT, atau Warga'], 403);
        }

        if ($validated['role_id'] == 8 && empty($validated['password'])) {
            $validated['password'] = Hash::make('warga123');
        } elseif (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            $validated['password'] = Hash::make('password123');
        }

        if (!empty($validated['block_id']) && !empty($validated['house_number'])) {
            $house = \App\Models\House::firstOrCreate([
                'block_id' => $validated['block_id'],
                'number' => $validated['house_number'],
            ]);
            $validated['house_id'] = $house->id;
        }
        unset($validated['house_number']);

        $user = User::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Warga berhasil ditambahkan',
            'data' => $user->load(['role', 'block', 'house', 'religion', 'maritalStatus', 'professionCategory'])
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'nik' => ['nullable', 'string', Rule::unique('users')->ignore($user->id)],
            'name' => 'required|string|max:255',
            'email' => ['nullable', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'phone_number' => 'nullable|string|max:20',
            'role_id' => 'required|exists:roles,id',
            'rt_id' => 'nullable|exists:rts,id',
            'block_id' => 'nullable|exists:blocks,id',
            'house_number' => 'nullable|string|max:10',
            'religion_id' => 'nullable|exists:religions,id',
            'marital_status_id' => 'nullable|exists:marital_statuses,id',
            'profession_category_id' => 'nullable|exists:profession_categories,id',
        ]);

        $currentUser = auth()->user();
        if ($currentUser->id !== $user->id) {
            if (in_array($currentUser->role_id, [4, 6])) {
                return response()->json(['message' => 'Sekretaris tidak memiliki akses untuk mengedit akun orang lain'], 403);
            }
            if ($currentUser->role_id == 2 && !in_array($validated['role_id'], [3, 4, 5])) {
                return response()->json(['message' => 'Ketua RW hanya dapat mengedit akun Sekretaris RW, Bendahara RW, atau Ketua RT'], 403);
            }
            if ($currentUser->role_id == 3 && !in_array($validated['role_id'], [6, 7, 8])) {
                return response()->json(['message' => 'Ketua RT hanya dapat mengedit akun Sekretaris RT, Bendahara RT, atau Warga'], 403);
            }
        }

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        if (!empty($validated['block_id']) && !empty($validated['house_number'])) {
            $house = \App\Models\House::firstOrCreate([
                'block_id' => $validated['block_id'],
                'number' => $validated['house_number'],
            ]);
            $validated['house_id'] = $house->id;
        }

        unset($validated['house_number']); // Remove house_number as it is not in users table

        $user->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Data warga berhasil diperbarui',
            'data' => $user->load(['role', 'block', 'house', 'religion', 'maritalStatus', 'professionCategory'])
        ]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if ($user->role_id == 1) {
            return response()->json(['message' => 'Tidak dapat menghapus Super Admin'], 400);
        }

        $user->delete();
        return response()->json(['message' => 'User berhasil dihapus']);
    }

    // --- APPROVAL SYSTEM ---
    
    public function getPendingApprovals()
    {
        $authUser = auth()->user();
        
        $query = User::with(['role', 'rt', 'block', 'house'])
                     ->where('is_approved', false);

        if (in_array($authUser->role_id, [3, 4, 6])) {
            // RT atau Sekretaris melihat warga yang status pendaftarannya 'pending'
            $query->where('registration_status', 'pending');
            // Jika RT atau Sekretaris RT, hanya lihat RT-nya
            if (in_array($authUser->role_id, [3, 6])) {
                $query->where('rt_id', $authUser->rt_id);
            }
        } elseif ($authUser->role_id == 1) {
            // Superadmin bisa melihat semua yang belum approved
        } else {
            // Role lain tidak berhak
            return response()->json(['status' => 'success', 'data' => []]);
        }

        $users = $query->get();
        return response()->json(['status' => 'success', 'data' => $users]);
    }

    public function approveUser($id)
    {
        $authUser = auth()->user();
        $user = User::findOrFail($id);

        if ($authUser->role_id == 3 && $authUser->rt_id != $user->rt_id) {
            return response()->json(['message' => 'Anda tidak berhak meng-approve warga di luar RT Anda'], 403);
        }
        
        if (in_array($authUser->role_id, [2, 5, 7, 8])) {
            return response()->json(['message' => 'Anda tidak memiliki akses untuk melakukan approval'], 403);
        }

        if (in_array($authUser->role_id, [1, 3, 4, 6])) {
            // Sekretaris, RT, atau SA melakukan persetujuan akhir
            $user->registration_status = 'approved';
            $user->is_approved = true;
            $user->save();
            return response()->json(['status' => 'success', 'message' => 'Warga berhasil disetujui']);
        }
        
        return response()->json(['status' => 'error', 'message' => 'Tidak valid'], 400);
    }

    public function rejectUser($id)
    {
        $authUser = auth()->user();
        $user = User::findOrFail($id);

        if ($authUser->role_id == 3 && $authUser->rt_id != $user->rt_id) {
            return response()->json(['message' => 'Anda tidak berhak menolak warga di luar RT Anda'], 403);
        }

        if ($authUser->role_id == 2) {
            return response()->json(['message' => 'RW tidak memiliki akses untuk menolak pendaftaran'], 403);
        }

        $user->delete();

        return response()->json(['status' => 'success', 'message' => 'Pendaftaran warga ditolak dan dihapus']);
    }
}
