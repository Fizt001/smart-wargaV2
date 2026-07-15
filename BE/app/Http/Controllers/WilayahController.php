<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Rt;
use App\Models\Block;

class WilayahController extends Controller
{
    // Cek Akses (Hanya SA & RW)
    private function checkAccess()
    {
        $role = auth()->user()->role_id;
        if (!in_array($role, [1, 2])) {
            abort(403, 'Akses ditolak. Hanya Superadmin dan Ketua RW yang diizinkan.');
        }
    }

    // --- RT MANAGEMENT ---

    public function getRts()
    {
        $this->checkAccess();
        $rts = Rt::withCount('blocks')->orderBy('name')->get();
        return response()->json(['status' => 'success', 'data' => $rts]);
    }

    public function storeRt(Request $request)
    {
        $this->checkAccess();
        $request->validate(['name' => 'required|string|max:255|unique:rts,name']);
        
        $rt = Rt::create(['name' => $request->name]);
        return response()->json(['status' => 'success', 'message' => 'RT berhasil ditambahkan', 'data' => $rt]);
    }

    public function updateRt(Request $request, $id)
    {
        $this->checkAccess();
        $rt = Rt::findOrFail($id);
        $request->validate(['name' => 'required|string|max:255|unique:rts,name,'.$id]);
        
        $rt->update(['name' => $request->name]);
        return response()->json(['status' => 'success', 'message' => 'RT berhasil diperbarui', 'data' => $rt]);
    }

    public function deleteRt($id)
    {
        $this->checkAccess();
        $rt = Rt::findOrFail($id);
        if ($rt->blocks()->count() > 0) {
            return response()->json(['message' => 'Tidak dapat menghapus RT yang masih memiliki blok.'], 400);
        }
        $rt->delete();
        return response()->json(['status' => 'success', 'message' => 'RT berhasil dihapus']);
    }

    // --- BLOCK MANAGEMENT ---

    public function getBlocks()
    {
        $this->checkAccess();
        $blocks = Block::with('rt')->orderBy('name')->get();
        return response()->json(['status' => 'success', 'data' => $blocks]);
    }

    public function storeBlock(Request $request)
    {
        $this->checkAccess();
        $request->validate([
            'name' => 'required|string|max:255',
            'rt_id' => 'required|exists:rts,id'
        ]);
        
        $block = Block::create($request->only('name', 'rt_id'));
        return response()->json(['status' => 'success', 'message' => 'Blok berhasil ditambahkan', 'data' => $block->load('rt')]);
    }

    public function updateBlock(Request $request, $id)
    {
        $this->checkAccess();
        $block = Block::findOrFail($id);
        $request->validate([
            'name' => 'required|string|max:255',
            'rt_id' => 'required|exists:rts,id'
        ]);
        
        $block->update($request->only('name', 'rt_id'));
        return response()->json(['status' => 'success', 'message' => 'Blok berhasil diperbarui', 'data' => $block->load('rt')]);
    }

    public function deleteBlock($id)
    {
        $this->checkAccess();
        $block = Block::findOrFail($id);
        $hasHouses = \App\Models\House::where('block_id', $id)->exists();
        if ($hasHouses) {
            return response()->json(['message' => 'Tidak dapat menghapus Blok yang masih memiliki daftar rumah.'], 400);
        }

        $block->delete();
        return response()->json(['status' => 'success', 'message' => 'Blok berhasil dihapus']);
    }

    // --- HOUSE MANAGEMENT ---

    public function getHouses($block_id)
    {
        $this->checkAccess();
        $houses = \App\Models\House::where('block_id', $block_id)
            ->with(['users' => function($q) {
                // Ambil pemegang rumah (misal yang role_id = 8 atau siapa saja penghuninya)
                $q->select('id', 'name', 'house_id', 'role_id');
            }])
            ->orderByRaw('CAST(number AS UNSIGNED)')
            ->get();
        return response()->json(['status' => 'success', 'data' => $houses]);
    }

    public function generateHouses(Request $request, $block_id)
    {
        $this->checkAccess();
        $block = Block::findOrFail($block_id);
        $request->validate([
            'count' => 'required|integer|min:1|max:100'
        ]);

        $count = $request->count;
        $created = 0;

        // Cek nomor rumah terakhir di blok ini untuk melanjutkan, atau mulai dari 1
        $lastHouse = \App\Models\House::where('block_id', $block_id)
                        ->orderByRaw('CAST(number AS UNSIGNED) DESC')
                        ->first();
        
        $start = $lastHouse ? (int)$lastHouse->number + 1 : 1;

        for ($i = 0; $i < $count; $i++) {
            $numStr = str_pad($start + $i, 2, '0', STR_PAD_LEFT);
            \App\Models\House::create([
                'block_id' => $block->id,
                'number' => $numStr
            ]);
            $created++;
        }

        return response()->json([
            'status' => 'success', 
            'message' => "Berhasil men-generate $created nomor rumah baru."
        ]);
    }

    public function deleteHouse($id)
    {
        $this->checkAccess();
        $house = \App\Models\House::findOrFail($id);
        
        $house->delete();
        
        return response()->json(['status' => 'success', 'message' => 'Rumah berhasil dihapus']);
    }

    // --- PUBLIC ENDPOINTS (FOR REGISTRATION) ---
    public function getPublicRts()
    {
        $rts = Rt::orderBy('name')->get(['id', 'name']);
        return response()->json(['status' => 'success', 'data' => $rts]);
    }

    public function getPublicBlocks($rt_id)
    {
        $blocks = Block::where('rt_id', $rt_id)->orderBy('name')->get(['id', 'name']);
        return response()->json(['status' => 'success', 'data' => $blocks]);
    }

    public function getPublicHouses($block_id)
    {
        // Hanya ambil rumah yang belum dimiliki user?
        // Aturan: Rumah bisa dipilih asalkan... wait, "rumah dan ada nama pemegang akun".
        // Mungkin kita ambil semua rumah saja, dan di FE ada label (Terisi / Kosong).
        // Atau ambil rumah yang belum ada user. Kita sediakan semua saja dulu.
        $houses = \App\Models\House::where('block_id', $block_id)
            ->orderByRaw('CAST(number AS UNSIGNED)')
            ->withCount('users')
            ->get();
        return response()->json(['status' => 'success', 'data' => $houses]);
    }
}
