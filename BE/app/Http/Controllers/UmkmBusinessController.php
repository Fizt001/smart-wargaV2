<?php

namespace App\Http\Controllers;

use App\Models\UmkmBusiness;
use Illuminate\Http\Request;

class UmkmBusinessController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Admin melihat semua, Warga melihat yang aktif
        $query = UmkmBusiness::with('user');
        
        if ($user->role_id >= 8) {
            $query->where('status', 'active')->orWhere('user_id', $user->id);
        }

        $records = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $records
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'category' => 'required|string',
            'phone' => 'required|string',
        ]);

        $data = $request->all();
        $data['user_id'] = $request->user()->id;
        $data['status'] = 'active';

        $record = UmkmBusiness::create($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Usaha UMKM berhasil didaftarkan',
            'data' => $record
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:active,inactive'
        ]);

        $record = UmkmBusiness::findOrFail($id);
        
        // Hanya pemilik atau admin yang bisa mengubah
        if ($request->user()->role_id >= 8 && $record->user_id !== $request->user()->id) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 403);
        }

        $record->update(['status' => $request->status]);

        return response()->json([
            'status' => 'success',
            'message' => 'Status UMKM diperbarui'
        ]);
    }
}
