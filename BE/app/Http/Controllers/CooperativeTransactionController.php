<?php

namespace App\Http\Controllers;

use App\Models\CooperativeTransaction;
use Illuminate\Http\Request;

class CooperativeTransactionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        if ($user->role_id >= 8) {
            $records = CooperativeTransaction::with('user')
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            $records = CooperativeTransaction::with('user')
                ->orderBy('created_at', 'desc')
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
            'type' => 'required|in:saving,loan',
            'amount' => 'required|numeric|min:1000',
            'term_months' => 'nullable|integer',
        ]);

        $data = $request->all();
        $data['user_id'] = $request->user()->id;
        $data['status'] = 'pending';
        
        if ($request->type === 'loan') {
            $data['interest_rate'] = 2.0; // Bunga 2% per bulan
        }

        $record = CooperativeTransaction::create($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengajuan ' . ($request->type === 'saving' ? 'Simpanan' : 'Pinjaman') . ' berhasil',
            'data' => $record
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected,paid'
        ]);

        $record = CooperativeTransaction::findOrFail($id);
        
        if ($request->status === 'approved' && $record->status === 'pending') {
            // Jika pinjaman disetujui, catat pengeluaran koperasi
            if ($record->type === 'loan') {
                \App\Models\Finance::create([
                    'user_id' => $request->user()->id,
                    'type' => 'expense',
                    'finance_category_id' => \App\Models\FinanceCategory::firstOrCreate(['name' => 'Pinjaman Koperasi', 'type' => 'expense'])->id,
                    'amount' => $record->amount,
                    'date' => date('Y-m-d'),
                    'description' => 'Pencairan pinjaman koperasi untuk warga: ' . $record->user->name,
                ]);
            }
            // Jika simpanan disetujui, catat pemasukan koperasi
            else if ($record->type === 'saving') {
                \App\Models\Finance::create([
                    'user_id' => $request->user()->id,
                    'type' => 'income',
                    'finance_category_id' => \App\Models\FinanceCategory::firstOrCreate(['name' => 'Simpanan Koperasi', 'type' => 'income'])->id,
                    'amount' => $record->amount,
                    'date' => date('Y-m-d'),
                    'description' => 'Simpanan koperasi dari warga: ' . $record->user->name,
                ]);
            }
        }
        
        if ($request->status === 'paid' && $record->type === 'loan') {
            // Jika pinjaman dilunasi, catat pemasukan koperasi (pokok + bunga)
            $interest = $record->amount * ($record->interest_rate / 100) * ($record->term_months ?: 1);
            $totalRepayment = $record->amount + $interest;
            
            \App\Models\Finance::create([
                'user_id' => $request->user()->id,
                'type' => 'income',
                'finance_category_id' => \App\Models\FinanceCategory::firstOrCreate(['name' => 'Pelunasan Pinjaman Koperasi', 'type' => 'income'])->id,
                'amount' => $totalRepayment,
                'date' => date('Y-m-d'),
                'description' => 'Pelunasan pinjaman (Pokok + Bunga) dari warga: ' . $record->user->name,
            ]);
        }

        $record->update(['status' => $request->status]);

        return response()->json([
            'status' => 'success',
            'message' => 'Status transaksi koperasi diperbarui'
        ]);
    }
}
