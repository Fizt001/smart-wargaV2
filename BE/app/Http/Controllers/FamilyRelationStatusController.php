<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FamilyRelationStatus;

class FamilyRelationStatusController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        if (!in_array($user->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $statuses = FamilyRelationStatus::all();
        return response()->json([
            'status' => 'success',
            'data' => $statuses
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if (!in_array($user->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255|unique:family_relation_statuses,name'
        ]);

        $status = FamilyRelationStatus::create([
            'name' => $request->name
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Status hubungan berhasil ditambahkan',
            'data' => $status
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        if (!in_array($user->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $status = FamilyRelationStatus::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:family_relation_statuses,name,' . $id
        ]);

        $status->update([
            'name' => $request->name
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Status hubungan berhasil diperbarui',
            'data' => $status
        ]);
    }

    public function destroy($id)
    {
        $user = auth()->user();
        if (!in_array($user->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $status = FamilyRelationStatus::findOrFail($id);
        
        // Cek apakah ada family_members yang memakai status ini
        $membersCount = \App\Models\FamilyMember::where('family_relation_status_id', $id)->count();

        if ($membersCount > 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Status hubungan tidak bisa dihapus karena sedang digunakan oleh ' . $membersCount . ' data.'
            ], 400);
        }

        $status->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Status hubungan berhasil dihapus'
        ]);
    }
}
