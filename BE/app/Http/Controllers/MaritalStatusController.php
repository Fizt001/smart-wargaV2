<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MaritalStatus;

class MaritalStatusController extends Controller
{
    public function index()
    {
        return response()->json([
            'status' => 'success',
            'data' => MaritalStatus::all()
        ]);
    }

    public function store(Request $request)
    {
        if (!in_array($request->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $request->validate(['name' => 'required|string|max:255|unique:marital_statuses,name']);
        $item = MaritalStatus::create(['name' => $request->name]);
        return response()->json(['status' => 'success', 'message' => 'Status perkawinan berhasil ditambahkan', 'data' => $item]);
    }

    public function update(Request $request, $id)
    {
        if (!in_array($request->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $item = MaritalStatus::findOrFail($id);
        $request->validate(['name' => 'required|string|max:255|unique:marital_statuses,name,' . $id]);
        $item->update(['name' => $request->name]);
        return response()->json(['status' => 'success', 'message' => 'Status perkawinan berhasil diperbarui', 'data' => $item]);
    }

    public function destroy($id)
    {
        if (!in_array(auth()->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $item = MaritalStatus::findOrFail($id);
        $used = \App\Models\User::where('marital_status_id', $id)->count();
        if ($used > 0) {
            return response()->json(['status' => 'error', 'message' => 'Status ini tidak bisa dihapus karena sedang digunakan oleh ' . $used . ' warga.'], 400);
        }
        $item->delete();
        return response()->json(['status' => 'success', 'message' => 'Status perkawinan berhasil dihapus']);
    }
}
