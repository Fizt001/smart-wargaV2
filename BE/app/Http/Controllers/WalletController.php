<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\WalletTransaction;

class WalletController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $transactions = WalletTransaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'balance' => $user->wallet_balance,
                'transactions' => $transactions,
            ]
        ]);
    }

    public function topup(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1000',
            'proof_of_payment' => 'nullable|file|image|max:2048'
        ]);

        $user = $request->user();

        DB::beginTransaction();
        try {
            $proofPath = $request->hasFile('proof_of_payment') 
                ? $request->file('proof_of_payment')->store('wallet_proofs', 'public') 
                : null;

            WalletTransaction::create([
                'user_id' => $user->id,
                'amount' => $request->amount,
                'type' => 'deposit',
                'status' => 'pending',
                'proof_of_payment' => $proofPath,
                'description' => 'Top Up Saldo Warga (Menunggu Verifikasi)',
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Pengajuan Top Up berhasil. Saldo akan bertambah setelah diverifikasi oleh Bendahara RT.',
                'data' => [
                    'balance' => $user->wallet_balance
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function pendingTopups(Request $request)
    {
        $user = $request->user();
        if ($user->role_id >= 8) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = WalletTransaction::with('user')->where('type', 'deposit')->where('status', 'pending')->orderBy('created_at', 'asc');

        if (in_array($user->role_id, [3, 6, 7])) {
            $query->whereHas('user', function($q) use ($user) {
                $q->where('rt_id', $user->rt_id);
            });
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->get()
        ]);
    }

    public function approveTopup(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role_id >= 8) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        DB::beginTransaction();
        try {
            $trx = WalletTransaction::findOrFail($id);
            if ($trx->status !== 'pending') {
                return response()->json(['message' => 'Status bukan pending'], 400);
            }

            $trx->status = 'approved';
            $trx->description = 'Top Up Saldo Warga (Disetujui)';
            $trx->save();

            $warga = $trx->user;
            $warga->wallet_balance += $trx->amount;
            $warga->save();

            DB::commit();

            return response()->json(['status' => 'success', 'message' => 'Top Up disetujui. Saldo Warga bertambah.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function rejectTopup(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role_id >= 8) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $trx = WalletTransaction::findOrFail($id);
            if ($trx->status !== 'pending') {
                return response()->json(['message' => 'Status bukan pending'], 400);
            }

            $trx->status = 'rejected';
            $trx->description = 'Top Up Saldo Warga (Ditolak)';
            $trx->save();

            return response()->json(['status' => 'success', 'message' => 'Top Up ditolak.']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function allWallets(Request $request)
    {
        $user = $request->user();

        if ($user->role_id >= 8) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = \App\Models\User::where('role_id', '>=', 8)
            ->select('id', 'name', 'phone_number', 'wallet_balance', 'rt_id')
            ->with('rt');

        if (in_array($user->role_id, [3, 6, 7])) {
            $query->where('rt_id', $user->rt_id);
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->get()
        ]);
    }
}
