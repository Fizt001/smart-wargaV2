<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use Illuminate\Http\Request;

class AssetController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = Asset::with('rt')->latest();

        // If RT/Warga, filter by their RT. RW sees all.
        if (!in_array($user->role_id, [1, 2, 4, 5])) { // If not RW or Superadmin
            $query->where('rt_id', $user->rt_id);
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->get()
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        // Only Sekretaris RT (6) and SA (1) can create assets
        if ($user->role_id != 6 && $user->role_id != 1) {
            return response()->json(['status' => 'error', 'message' => 'Hanya Sekretaris RT yang dapat menambahkan aset'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1',
            'condition' => 'required|in:good,damaged,maintenance',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'source' => 'nullable|string',
            'rt_id' => $user->role_id == 1 ? 'required|exists:rts,id' : 'nullable'
        ]);

        if ($user->role_id == 6) {
            $validated['rt_id'] = $user->rt_id;
        } // If SA (1), it will take from $validated['rt_id']

        $asset = Asset::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Aset berhasil ditambahkan.',
            'data' => $asset->load('rt')
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $asset = Asset::findOrFail($id);

        if (!in_array($user->role_id, [1, 6]) || ($user->role_id == 6 && $asset->rt_id != $user->rt_id)) {
            return response()->json(['status' => 'error', 'message' => 'Hanya Sekretaris RT terkait yang dapat mengubah aset'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1',
            'condition' => 'required|in:good,damaged,maintenance',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'source' => 'nullable|string',
            'rt_id' => $user->role_id == 1 ? 'required|exists:rts,id' : 'nullable'
        ]);

        if ($user->role_id == 6) {
            unset($validated['rt_id']); // RT Secretary cannot change RT ownership
        }

        $asset->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Aset berhasil diperbarui.',
            'data' => $asset->load('rt')
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $asset = Asset::findOrFail($id);

        if (!in_array($user->role_id, [1, 6]) || ($user->role_id == 6 && $asset->rt_id != $user->rt_id)) {
            return response()->json(['status' => 'error', 'message' => 'Hanya Sekretaris RT terkait yang dapat menghapus aset'], 403);
        }

        $request->validate([
            'deleted_reason' => 'required|string|max:255'
        ]);

        $asset->update(['deleted_reason' => $request->deleted_reason]);
        $asset->delete(); // Soft delete

        return response()->json([
            'status' => 'success',
            'message' => 'Aset berhasil dihapus.'
        ]);
    }
}
