<?php

namespace App\Http\Controllers;

use App\Models\WasteDeposit;
use App\Models\WalletTransaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WasteDepositController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        if ($user->role_id >= 8) {
            $records = WasteDeposit::with('user')
                ->where('user_id', $user->id)
                ->orderBy('date', 'desc')
                ->get();
        } else {
            $records = WasteDeposit::with('user')
                ->orderBy('date', 'desc')
                ->get();
        }

        return response()->json([
            'status' => 'success',
            'data' => $records
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'waste_type' => 'required|string',
            'weight_kg' => 'required|numeric',
            'price_per_kg' => 'required|numeric',
            'payment_method' => 'required|in:wallet,cash'
        ]);

        $data = $request->all();
        $data['user_id'] = $request->user()->id;
        $data['date'] = date('Y-m-d');
        $data['total_amount'] = $data['weight_kg'] * $data['price_per_kg'];
        $data['status'] = 'pending';

        $record = WasteDeposit::create($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Setoran sampah berhasil dicatat',
            'data' => $record
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected'
        ]);

        $record = WasteDeposit::findOrFail($id);
        
        if ($request->status === 'approved' && $record->status !== 'approved') {
            DB::beginTransaction();
            try {
                if ($record->payment_method === 'wallet') {
                    // Tambah saldo warga
                    $user = User::find($record->user_id);
                    $user->wallet_balance += $record->total_amount;
                    $user->save();

                    WalletTransaction::create([
                        'user_id' => $user->id,
                        'amount' => $record->total_amount,
                        'type' => 'deposit',
                        'status' => 'approved',
                        'description' => 'Reward setoran Bank Sampah: ' . $record->waste_type . ' (' . $record->weight_kg . ' kg)',
                    ]);
                }
                
                $record->status = 'approved';
                $record->save();
                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal memproses setoran: ' . $e->getMessage()
                ], 500);
            }
        } else {
            $record->update(['status' => $request->status]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Setoran sampah ' . $request->status
        ]);
    }
}
