<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Religion;

class ReligionController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        if (!in_array($user->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $religions = Religion::all();
        return response()->json([
            'status' => 'success',
            'data' => $religions
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if (!in_array($user->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255|unique:religions,name'
        ]);

        $religion = Religion::create([
            'name' => $request->name
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Agama berhasil ditambahkan',
            'data' => $religion
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        if (!in_array($user->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $religion = Religion::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:religions,name,' . $id
        ]);

        $religion->update([
            'name' => $request->name
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Agama berhasil diperbarui',
            'data' => $religion
        ]);
    }

    public function destroy($id)
    {
        $user = auth()->user();
        if (!in_array($user->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $religion = Religion::findOrFail($id);
        
        // Cek apakah ada users atau family_members yang memakai agama ini
        $usersCount = \App\Models\User::where('religion_id', $id)->count();
        $membersCount = \App\Models\FamilyMember::where('religion_id', $id)->count();

        if ($usersCount > 0 || $membersCount > 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Agama tidak bisa dihapus karena sedang digunakan oleh ' . ($usersCount + $membersCount) . ' data.'
            ], 400);
        }

        $religion->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Agama berhasil dihapus'
        ]);
    }
}
