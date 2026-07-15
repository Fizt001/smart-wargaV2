<?php

namespace App\Http\Controllers;

use App\Models\AssetBorrowing;
use App\Models\Asset;
use Illuminate\Http\Request;

class AssetBorrowingController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $query = AssetBorrowing::with(['user', 'asset'])->latest();

        if ($user->role_id == 8) {
            // Warga sees only their own borrowings
            $query->where('user_id', $user->id);
        } else if (!in_array($user->role_id, [1, 2, 4, 5])) {
            // RT level (Ketua RT, Sekretaris RT, Bendahara RT) sees borrowings for their RT's assets
            $query->whereHas('asset', function($q) use ($user) {
                $q->where('rt_id', $user->rt_id);
            });
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->get()
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'quantity' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'purpose' => 'nullable|string'
        ]);

        $asset = Asset::findOrFail($validated['asset_id']);
        
        // Warga can only borrow from their own RT
        if ($user->rt_id != $asset->rt_id && $user->role_id == 8) {
            return response()->json([
                'status' => 'error', 
                'message' => 'Anda hanya dapat meminjam aset milik RT Anda.'
            ], 403);
        }

        if ($asset->quantity < $validated['quantity'] || $asset->condition != 'good') {
             return response()->json([
                 'status' => 'error', 
                 'message' => 'Aset tidak tersedia atau jumlah tidak mencukupi.'
             ], 400);
        }

        $borrowing = AssetBorrowing::create([
            'asset_id' => $validated['asset_id'],
            'user_id' => $user->id,
            'quantity' => $validated['quantity'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'purpose' => $validated['purpose'],
            'status' => 'pending'
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Permohonan pinjam berhasil diajukan.',
            'data' => $borrowing
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $user = $request->user();
        $borrowing = AssetBorrowing::with('asset')->findOrFail($id);

        // Only Sekretaris RT (6) and SA (1) can update status
        if (!in_array($user->role_id, [1, 6]) || ($user->role_id == 6 && $borrowing->asset->rt_id != $user->rt_id)) {
            return response()->json(['status' => 'error', 'message' => 'Hanya Sekretaris RT terkait yang dapat mengubah status peminjaman'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,approved,returned,rejected'
        ]);

        $borrowing->update(['status' => $validated['status']]);

        return response()->json([
            'status' => 'success',
            'message' => 'Status peminjaman berhasil diperbarui.',
            'data' => $borrowing
        ]);
    }

    public function returnAsset(Request $request, $id)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'donation_amount' => 'nullable|numeric|min:0'
        ]);

        $borrowing = AssetBorrowing::findOrFail($id);
        
        if ($borrowing->user_id != $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Hanya peminjam yang dapat mengembalikan.'], 403);
        }
        
        if ($borrowing->status !== 'approved') {
            return response()->json(['status' => 'error', 'message' => 'Status aset tidak dalam status dipinjam.'], 400);
        }

        $donationAmount = $validated['donation_amount'] ?? 0;

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            if ($donationAmount > 0) {
                if ($user->wallet_balance < $donationAmount) {
                    return response()->json(['status' => 'error', 'message' => 'Saldo dompet tidak mencukupi untuk donasi.'], 400);
                }

                // Deduct balance
                $user->wallet_balance -= $donationAmount;
                $user->save();

                // Record transaction
                \App\Models\WalletTransaction::create([
                    'user_id' => $user->id,
                    'amount' => $donationAmount,
                    'type' => 'donation', // or withdrawal, but donation is in the enum and makes sense
                    'status' => 'approved',
                    'description' => 'Donasi peminjaman aset: ' . $borrowing->asset->name,
                ]);
                
                // Add to RW Finance
                \App\Models\Finance::create([
                    'user_id' => $user->id,
                    'type' => 'income',
                    'finance_category_id' => \App\Models\FinanceCategory::firstOrCreate(['name' => 'Donasi Perawatan Sarana', 'type' => 'income'])->id,
                    'amount' => $donationAmount,
                    'date' => date('Y-m-d'),
                    'description' => 'Donasi peminjaman aset (Perawatan Sarana) dari warga: ' . $user->name,
                ]);
            }

            $borrowing->update(['status' => 'returned']);

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Aset berhasil dikembalikan.',
                'data' => $borrowing
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Return Asset Error: ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
            return response()->json(['status' => 'error', 'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()], 500);
        }
    }
}
