<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ProfessionCategory;

class ProfessionCategoryController extends Controller
{
    public function index()
    {
        return response()->json([
            'status' => 'success',
            'data' => ProfessionCategory::all()
        ]);
    }

    public function store(Request $request)
    {
        if (!in_array($request->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $request->validate(['name' => 'required|string|max:255|unique:profession_categories,name']);
        $item = ProfessionCategory::create(['name' => $request->name]);
        return response()->json(['status' => 'success', 'message' => 'Kategori profesi berhasil ditambahkan', 'data' => $item]);
    }

    public function update(Request $request, $id)
    {
        if (!in_array($request->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $item = ProfessionCategory::findOrFail($id);
        $request->validate(['name' => 'required|string|max:255|unique:profession_categories,name,' . $id]);
        $item->update(['name' => $request->name]);
        return response()->json(['status' => 'success', 'message' => 'Kategori profesi berhasil diperbarui', 'data' => $item]);
    }

    public function destroy($id)
    {
        if (!in_array(auth()->user()->role_id, [1, 2])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $item = ProfessionCategory::findOrFail($id);
        $used = \App\Models\User::where('profession_category_id', $id)->count();
        if ($used > 0) {
            return response()->json(['status' => 'error', 'message' => 'Kategori ini tidak bisa dihapus karena sedang digunakan oleh ' . $used . ' warga.'], 400);
        }
        $item->delete();
        return response()->json(['status' => 'success', 'message' => 'Kategori profesi berhasil dihapus']);
    }
}
