<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\RwDeposit;

class RwDepositController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        
        $query = RwDeposit::with(['rt', 'verifier'])->latest();

        if (in_array($user->role_id, [3, 6, 7])) {
            // RT only sees their own
            $query->where('rt_id', $user->rt_id);
        } elseif (in_array($user->role_id, [1, 2, 4, 5])) {
            // RW and SA sees all
            if ($request->has('rt_id') && $request->rt_id != '') {
                $query->where('rt_id', $request->rt_id);
            }
        } else {
            return response()->json(['data' => []]);
        }

        if ($request->has('month')) {
            $query->where('month', $request->month);
        }
        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        // Only Bendahara RT (7) or Ketua RT (3) or SA (1) can submit
        if (!in_array($user->role_id, [1, 3, 7])) {
            return response()->json(['message' => 'Hanya Bendahara/Ketua RT yang dapat melaporkan setoran.'], 403);
        }

        $validated = $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020|max:2099',
            'amount' => 'required|numeric|min:0',
            'proof_image' => 'required|image|mimes:jpeg,png,jpg|max:5120',
            'notes' => 'nullable|string'
        ]);

        $rt_id = $user->rt_id;
        if ($user->role_id == 1) {
            $request->validate(['rt_id' => 'required|exists:rts,id']);
            $rt_id = $request->rt_id;
        }

        // Check if already deposited for this month/year and not rejected
        $existing = RwDeposit::where('rt_id', $rt_id)
            ->where('month', $validated['month'])
            ->where('year', $validated['year'])
            ->whereIn('status', ['pending', 'verified'])
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Setoran untuk bulan tersebut sudah ada dan sedang diproses/selesai.'], 400);
        }

        $path = $request->file('proof_image')->store('rw_deposits', 'public');

        $deposit = RwDeposit::create([
            'rt_id' => $rt_id,
            'month' => $validated['month'],
            'year' => $validated['year'],
            'amount' => $validated['amount'],
            'proof_image_path' => $path,
            'notes' => $validated['notes'],
            'status' => 'pending'
        ]);

        return response()->json(['message' => 'Setoran berhasil dilaporkan. Menunggu verifikasi RW.', 'data' => $deposit], 201);
    }

    public function verify(Request $request, $id)
    {
        $user = auth()->user();

        // Only Bendahara RW (5) or Ketua RW (2) or SA (1) can verify
        if (!in_array($user->role_id, [1, 2, 5])) {
            return response()->json(['message' => 'Hanya Bendahara/Ketua RW yang dapat memverifikasi setoran.'], 403);
        }

        $deposit = RwDeposit::findOrFail($id);

        if ($deposit->status == 'verified') {
            return response()->json(['message' => 'Setoran sudah diverifikasi.'], 400);
        }

        $request->validate([
            'status' => 'required|in:verified,rejected',
            'notes' => 'nullable|string'
        ]);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            $deposit->update([
                'status' => $request->status,
                'verified_by' => $user->id,
            ]);

            if ($request->has('notes')) {
                $deposit->notes = $request->notes;
                $deposit->save();
            }

            if ($request->status == 'verified') {
                \App\Models\Finance::create([
                    'finance_category_id' => 1, // Default to 1
                    'user_id' => $user->id,
                    'type' => 'income',
                    'amount' => $deposit->amount,
                    'description' => "Setoran IPL dari " . $deposit->rt->name . " (Bulan {$deposit->month}/{$deposit->year})",
                    'date' => now()->format('Y-m-d')
                ]);
            }

            \Illuminate\Support\Facades\DB::commit();
            return response()->json(['message' => 'Status setoran berhasil diperbarui.']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Gagal memproses verifikasi.'], 500);
        }
    }
}

