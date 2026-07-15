<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Letter;
use App\Models\LetterType;

class LetterController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        if ($user->role_id == 8) {
            // Warga sees own
            $letters = Letter::with(['user', 'letterType'])->where('user_id', $user->id)->latest()->get();
        } else if (in_array($user->role_id, [3, 6, 7])) {
            // RT sees their RT's
            $letters = Letter::with(['user', 'letterType'])->whereHas('user', function($q) use ($user) {
                $q->where('rt_id', $user->rt_id);
            })->latest()->get();
        } else {
            // RW and SA sees all
            $letters = Letter::with(['user', 'letterType'])->latest()->get();
        }

        return response()->json([
            'status' => 'success',
            'data' => $letters
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'letter_type_id' => 'required|exists:letter_types,id',
            'notes' => 'required|string',
        ]);

        $letter = Letter::create([
            'user_id' => $request->user()->id,
            'letter_type_id' => $validated['letter_type_id'],
            'notes' => $validated['notes'],
            'status' => 'pending',
            'letter_number' => 'SRT-' . date('Ymd') . '-' . rand(1000, 9999)
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Permohonan surat berhasil diajukan',
            'data' => $letter->load(['user', 'letterType'])
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $letter = Letter::with('letterType')->findOrFail($id);
        $user = $request->user();

        $validated = $request->validate([
            'status' => 'required|in:pending,approved_rt,approved,rejected,completed',
        ]);

        // Only pengurus can change status
        if ($user->role_id == 8) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        $newStatus = $validated['status'];

        // Logic for requires_rw_approval
        if ($newStatus === 'approved' && in_array($user->role_id, [3, 6])) {
            // RT (Ketua/Sekretaris) is approving
            if ($letter->letterType->requires_rw_approval) {
                $newStatus = 'approved_rt'; // Needs RW next
            }
        }

        $letter->update(['status' => $newStatus]);

        return response()->json([
            'status' => 'success',
            'message' => 'Status surat berhasil diperbarui',
            'data' => $letter->load(['user', 'letterType'])
        ]);
    }

    public function destroy($id)
    {
        $letter = Letter::findOrFail($id);
        
        // Only allow deleting pending letters
        if ($letter->status !== 'pending' && request()->user()->role_id == 8) {
            return response()->json([
                'status' => 'error',
                'message' => 'Surat yang sudah diproses tidak dapat dihapus'
            ], 403);
        }

        $letter->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Permohonan surat berhasil dibatalkan'
        ]);
    }

    public function types()
    {
        $types = LetterType::all();
        return response()->json([
            'status' => 'success',
            'data' => $types
        ]);
    }
}
