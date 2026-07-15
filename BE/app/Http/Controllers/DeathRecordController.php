<?php

namespace App\Http\Controllers;

use App\Models\DeathRecord;
use Illuminate\Http\Request;

class DeathRecordController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        if ($user->role_id >= 8) {
            $records = DeathRecord::with('reporter')
                ->where('reporter_id', $user->id)
                ->orderBy('date_of_death', 'desc')
                ->get();
        } else {
            $records = DeathRecord::with('reporter')
                ->orderBy('date_of_death', 'desc')
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
            'deceased_name' => 'required|string',
            'date_of_death' => 'required|date',
        ]);

        $data = $request->all();
        $data['reporter_id'] = $request->user()->id;
        $data['status'] = 'pending';

        $record = DeathRecord::create($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Laporan kematian berhasil dicatat',
            'data' => $record
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,disbursed',
            'compensation_amount' => 'nullable|numeric'
        ]);

        $record = DeathRecord::findOrFail($id);
        
        if ($request->status === 'disbursed' && $record->status !== 'disbursed') {
            // Catat pengeluaran di RW
            if ($request->compensation_amount > 0) {
                \App\Models\Finance::create([
                    'user_id' => $request->user()->id,
                    'type' => 'expense',
                    'finance_category_id' => \App\Models\FinanceCategory::firstOrCreate(['name' => 'Santunan Kematian', 'type' => 'expense'])->id,
                    'amount' => $request->compensation_amount,
                    'date' => date('Y-m-d'),
                    'description' => 'Pencairan santunan duka cita untuk Almarhum/ah: ' . $record->deceased_name,
                ]);
            }
        }

        $record->update([
            'status' => $request->status,
            'compensation_amount' => $request->compensation_amount ?? $record->compensation_amount
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Status laporan kematian diperbarui'
        ]);
    }
}
