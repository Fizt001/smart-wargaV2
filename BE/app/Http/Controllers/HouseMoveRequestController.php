<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\HouseMoveRequest;
use App\Models\User;
use App\Models\House;
use Illuminate\Support\Facades\Auth;

class HouseMoveRequestController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        $query = HouseMoveRequest::with(['user', 'oldRt', 'oldHouse', 'newRt', 'newBlock'])
                                 ->orderBy('created_at', 'desc');

        // Jika RT, hanya lihat request yang masuk ke RT dia atau keluar dari RT dia
        if ($user->role_id == 3) {
            $query->where(function ($q) use ($user) {
                $q->where('new_rt_id', $user->rt_id)
                  ->orWhere('old_rt_id', $user->rt_id);
            });
        }
        // Jika Warga, hanya lihat request sendiri
        elseif ($user->role_id == 8) {
            $query->where('user_id', $user->id);
        }
        
        $requests = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $requests
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:out,cross_rt,within_rt',
            'new_rt_id' => 'required_if:type,cross_rt,within_rt|exists:rts,id|nullable',
            'new_block_id' => 'required_if:type,cross_rt,within_rt|exists:blocks,id|nullable',
            'new_house_number' => 'required_if:type,cross_rt,within_rt|string|max:10|nullable',
            'reason' => 'nullable|string'
        ]);

        $user = Auth::user();

        // Check if there is already a pending request
        $existing = HouseMoveRequest::where('user_id', $user->id)
                                    ->where('status', 'pending')
                                    ->first();
        if ($existing) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda sudah memiliki pengajuan pindah rumah yang sedang diproses.'
            ], 400);
        }

        $moveRequest = HouseMoveRequest::create([
            'user_id' => $user->id,
            'type' => $validated['type'],
            'old_rt_id' => $user->rt_id,
            'old_house_id' => $user->house_id,
            'new_rt_id' => $validated['new_rt_id'] ?? null,
            'new_block_id' => $validated['new_block_id'] ?? null,
            'new_house_number' => $validated['new_house_number'] ?? null,
            'reason' => $validated['reason'] ?? null,
            'status' => 'pending'
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengajuan pindah rumah berhasil dikirim. Menunggu konfirmasi pengurus.',
            'data' => $moveRequest
        ], 201);
    }

    public function approve($id)
    {
        $moveRequest = HouseMoveRequest::findOrFail($id);
        $approver = Auth::user();

        // Security Check
        if (!in_array($approver->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($moveRequest->status !== 'pending') {
            return response()->json(['message' => 'Pengajuan ini sudah diproses sebelumnya.'], 400);
        }

        $warga = User::findOrFail($moveRequest->user_id);

        if ($moveRequest->type === 'out') {
            // Remove from RT and House
            $warga->rt_id = null;
            $warga->block_id = null;
            $warga->house_id = null;
        } else {
            // Find or create the new house
            $house = House::firstOrCreate([
                'block_id' => $moveRequest->new_block_id,
                'number' => $moveRequest->new_house_number,
            ]);

            $warga->rt_id = $moveRequest->new_rt_id;
            $warga->block_id = $moveRequest->new_block_id;
            $warga->house_id = $house->id;
        }

        $warga->save();

        $moveRequest->status = 'approved';
        $moveRequest->approved_by = $approver->id;
        $moveRequest->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Pengajuan pindah rumah berhasil disetujui.'
        ]);
    }

    public function reject($id)
    {
        $moveRequest = HouseMoveRequest::findOrFail($id);
        $approver = Auth::user();

        // Security Check
        if (!in_array($approver->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($moveRequest->status !== 'pending') {
            return response()->json(['message' => 'Pengajuan ini sudah diproses sebelumnya.'], 400);
        }

        $moveRequest->status = 'rejected';
        $moveRequest->approved_by = $approver->id;
        $moveRequest->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Pengajuan pindah rumah telah ditolak.'
        ]);
    }
}
