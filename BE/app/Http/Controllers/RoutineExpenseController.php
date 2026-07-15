<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\RoutineExpense;
use App\Models\RoutineExpenseRecord;
use Illuminate\Support\Facades\Storage;

class RoutineExpenseController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $year = $request->query('year', date('Y'));
        
        $query = RoutineExpense::with(['rt']);

        if (in_array($user->role_id, [3, 6, 7])) {
            $query->where(function ($q) use ($user) {
                $q->where('rt_id', $user->rt_id)->orWhereHas('rts', function($q2) use ($user) {
                    $q2->where('rt_id', $user->rt_id);
                });
            });
        } else {
            // For RW, they see all RW level, plus RT level if they filter
            if ($request->has('rt_id') && $request->rt_id != '') {
                $query->where(function ($q) use ($request) {
                    $q->where('rt_id', $request->rt_id)->orWhereHas('rts', function($q2) use ($request) {
                        $q2->where('rt_id', $request->rt_id);
                    });
                });
            } else {
                $query->where('level', 'RW');
            }
        }

        $expenses = $query->get();
        
        // Eager load records for the requested year, and the pivot RTs
        $expenses->load(['records' => function($q) use ($year) {
            $q->where('year', $year);
        }, 'rts']);

        return response()->json([
            'status' => 'success',
            'data' => $expenses
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0', // for RT this is the target/actual amount
            'target_amount' => 'nullable|numeric|min:0',
            'per_kk_amount' => 'nullable|numeric|min:0',
            'rt_ids' => 'nullable|array',
            'rt_ids.*' => 'exists:rts,id'
        ]);

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            if (in_array($user->role_id, [3, 6, 7])) {
                $validated['rt_id'] = $user->rt_id;
                $validated['level'] = 'RT';
                $expense = RoutineExpense::create($validated);
            } else {
                $validated['level'] = 'RW';
                $validated['rt_id'] = null;
                $expense = RoutineExpense::create([
                    'title' => $validated['title'],
                    'description' => $validated['description'],
                    'level' => 'RW',
                    'target_amount' => $validated['target_amount'] ?? 0,
                    'per_kk_amount' => $validated['per_kk_amount'] ?? 0,
                    'amount' => 0, // unused for RW, we use target_amount
                ]);

                if (!empty($validated['rt_ids'])) {
                    $totalKkAll = 0;
                    foreach ($validated['rt_ids'] as $rtId) {
                        $totalKk = \App\Models\User::where('role_id', 8)
                            ->where('rt_id', $rtId)
                            ->whereHas('family', function($q) {
                                $q->where('type', 'inti');
                            })->count();
                            
                        \App\Models\RoutineExpenseRt::create([
                            'routine_expense_id' => $expense->id,
                            'rt_id' => $rtId,
                            'per_kk_amount' => $validated['per_kk_amount'] ?? 0,
                            'total_kk' => $totalKk
                        ]);
                        
                        $totalKkAll += $totalKk;

                        // Create Billing Component for this RT
                        \App\Models\BillingComponent::create([
                            'name' => $expense->title,
                            'amount' => $validated['per_kk_amount'] ?? 0,
                            'level' => 'RT',
                            'rt_id' => $rtId,
                            'is_active' => true,
                            'is_rw_mandated' => true,
                            'routine_expense_id' => $expense->id
                        ]);
                    }
                    $expense->update(['total_kk' => $totalKkAll]);
                }
            }
            \Illuminate\Support\Facades\DB::commit();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Master pengeluaran rutin berhasil dibuat',
                'data' => $expense
            ], 201);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat pengeluaran rutin: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $user = auth()->user();
        $expense = RoutineExpense::findOrFail($id);

        if (in_array($user->role_id, [3, 6, 7]) && $expense->rt_id != $user->rt_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $expense->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Master pengeluaran rutin berhasil dihapus'
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        $expense = RoutineExpense::findOrFail($id);

        if (in_array($user->role_id, [3, 6, 7]) && $expense->rt_id != $user->rt_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
        ]);

        $expense->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Master pengeluaran rutin berhasil diperbarui',
            'data' => $expense
        ]);
    }

    public function pay(Request $request, $id)
    {
        $user = auth()->user();
        $expense = RoutineExpense::findOrFail($id);

        if (in_array($user->role_id, [3, 6, 7]) && $expense->rt_id != $user->rt_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer',
            'actual_expense' => 'required|numeric|min:0',
            'receipt_proof' => 'required|file|mimes:jpeg,png,jpg,pdf|max:5120',
            'photo_proof' => 'nullable|file|mimes:jpeg,png,jpg|max:5120',
        ]);

        // Validate sequential payment rule: previous month must be paid if year is the same
        if ($validated['month'] > 1) {
            $previousMonthPaid = RoutineExpenseRecord::where('routine_expense_id', $id)
                ->where('year', $validated['year'])
                ->where('month', $validated['month'] - 1)
                ->exists();
                
            if (!$previousMonthPaid) {
                return response()->json(['message' => 'Anda harus membayar tagihan bulan sebelumnya terlebih dahulu.'], 400);
            }
        }

        // Check if already paid
        $alreadyPaid = RoutineExpenseRecord::where('routine_expense_id', $id)
            ->where('year', $validated['year'])
            ->where('month', $validated['month'])
            ->exists();
            
        if ($alreadyPaid) {
            return response()->json(['message' => 'Tagihan untuk bulan ini sudah dibayar.'], 400);
        }

        $recordData = [
            'routine_expense_id' => $id,
            'user_id' => $user->id,
            'month' => $validated['month'],
            'year' => $validated['year'],
            'actual_expense' => $validated['actual_expense'],
            'status' => 'paid',
        ];

        if ($request->hasFile('receipt_proof')) {
            $recordData['receipt_proof'] = $request->file('receipt_proof')->store('proofs/receipts', 'public');
        }

        if ($request->hasFile('photo_proof')) {
            $recordData['photo_proof'] = $request->file('photo_proof')->store('proofs/photos', 'public');
        }

        $record = RoutineExpenseRecord::create($recordData);

        return response()->json([
            'status' => 'success',
            'message' => 'Pembayaran rutin berhasil dicatat',
            'data' => $record
        ]);
    }
}
