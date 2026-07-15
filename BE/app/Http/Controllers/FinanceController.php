<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Finance;
use App\Models\FinanceCategory;

class FinanceController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        
        $financesQuery = Finance::with(['category', 'user'])->orderBy('date', 'desc')->orderBy('id', 'desc');
        $billingsQuery = \App\Models\Billing::with('user')->where('status', 'paid');
        $activitiesQuery = \App\Models\Activity::with('user')->where('status', 'executed');
        $routineRecordsQuery = \App\Models\RoutineExpenseRecord::with(['user', 'routineExpense']);
        
        if (in_array($user->role_id, [3, 6, 7])) {
            $financesQuery->whereHas('user', function($q) use ($user) {
                $q->where('rt_id', $user->rt_id);
            });
            $billingsQuery->whereHas('user', function($q) use ($user) {
                $q->where('rt_id', $user->rt_id);
            });
            $activitiesQuery->where('rt_id', $user->rt_id);
            $routineRecordsQuery->whereHas('routineExpense', function($q) use ($user) {
                $q->where('rt_id', $user->rt_id);
            });
        } elseif ($request->has('rt_id') && $request->rt_id != '') {
            $financesQuery->whereHas('user', function($q) use ($request) {
                $q->where('rt_id', $request->rt_id);
            });
            $billingsQuery->whereHas('user', function($q) use ($request) {
                $q->where('rt_id', $request->rt_id);
            });
            $activitiesQuery->where('rt_id', $request->rt_id);
            $routineRecordsQuery->whereHas('routineExpense', function($q) use ($request) {
                $q->where('rt_id', $request->rt_id);
            });
        }
        
        $finances = $financesQuery->get()->map(function($f) {
            $f->is_editable = true;
            return $f;
        });
        
        $manualIncome = (clone $financesQuery)->where('type', 'income')->sum('amount');
        
        $paidBillings = $billingsQuery->get();
        $totalIplIncome = $paidBillings->sum('total_amount');
        
        $activities = $activitiesQuery->get();
        $totalActivityExpense = $activities->sum('actual_expense');

        $routineRecords = $routineRecordsQuery->get();
        $totalRoutineExpense = $routineRecords->sum('actual_expense');
        
        $totalIncome = $manualIncome + $totalIplIncome;
        $totalExpense = $totalActivityExpense + $totalRoutineExpense; // We only use activities and routine records for expenses now
        $balance = $totalIncome - $totalExpense;

        $iplTransactions = $paidBillings->map(function($billing) {
            return [
                'id' => 'ipl_' . $billing->id,
                'date' => clone $billing->updated_at,
                'date_formatted' => $billing->updated_at->format('Y-m-d'),
                'category' => ['name' => 'Pemasukan IPL'],
                'description' => 'Pembayaran IPL ' . ($billing->user ? $billing->user->name : 'Warga') . ' (Bulan ' . $billing->month . '/' . $billing->year . ')',
                'type' => 'income',
                'amount' => $billing->total_amount,
                'is_editable' => false
            ];
        });

        $activityTransactions = $activities->map(function($activity) {
            return [
                'id' => 'act_' . $activity->id,
                'date' => clone $activity->updated_at,
                'date_formatted' => $activity->updated_at->format('Y-m-d'),
                'category' => ['name' => 'Biaya Kegiatan Warga'],
                'description' => 'Kegiatan: ' . $activity->title,
                'type' => 'expense',
                'amount' => $activity->actual_expense,
                'is_editable' => false,
                'proof_link' => $activity->receipt_proof ? asset('storage/' . $activity->receipt_proof) : null
            ];
        });

        $routineTransactions = $routineRecords->map(function($record) {
            return [
                'id' => 'rou_' . $record->id,
                'date' => clone $record->updated_at,
                'date_formatted' => $record->updated_at->format('Y-m-d'),
                'category' => ['name' => 'Pengeluaran Rutin (Wajib)'],
                'description' => 'Pembayaran ' . ($record->routineExpense ? $record->routineExpense->title : 'Rutin') . ' (Bulan ' . $record->month . '/' . $record->year . ')',
                'type' => 'expense',
                'amount' => $record->actual_expense,
                'is_editable' => false,
                'proof_link' => $record->receipt_proof ? asset('storage/' . $record->receipt_proof) : null
            ];
        });

        // Merge and sort
        $allTransactions = collect($finances)->filter(function($f) {
            return $f->type === 'income'; // Ignore old manual expenses if any
        })->map(function($f) {
            $fArray = $f->toArray();
            $fArray['date_formatted'] = $f->date; // Assumes date is a string or casted
            $fArray['date_obj'] = \Carbon\Carbon::parse($f->date);
            return $fArray;
        })->concat($iplTransactions->map(function($i) {
            $i['date_obj'] = $i['date'];
            $i['date'] = $i['date_formatted'];
            return $i;
        }))->concat($activityTransactions->map(function($i) {
            $i['date_obj'] = $i['date'];
            $i['date'] = $i['date_formatted'];
            return $i;
        }))->concat($routineTransactions->map(function($i) {
            $i['date_obj'] = $i['date'];
            $i['date'] = $i['date_formatted'];
            return $i;
        }))->sortByDesc('date_obj')->values()->map(function($t) {
            unset($t['date_obj']);
            unset($t['date_formatted']);
            return $t;
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'transactions' => $allTransactions,
                'summary' => [
                    'total_income' => $totalIncome,
                    'total_expense' => $totalExpense,
                    'balance' => $balance
                ]
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'finance_category_id' => 'required|exists:finance_categories,id',
            'user_id' => 'nullable|exists:users,id',
            'type' => 'required|in:income,expense',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'date' => 'required|date',
        ]);

        $finance = Finance::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Transaksi berhasil ditambahkan',
            'data' => $finance->load(['category', 'user'])
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $finance = Finance::findOrFail($id);

        $validated = $request->validate([
            'finance_category_id' => 'required|exists:finance_categories,id',
            'user_id' => 'nullable|exists:users,id',
            'type' => 'required|in:income,expense',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'date' => 'required|date',
        ]);

        $finance->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Transaksi berhasil diperbarui',
            'data' => $finance->load(['category', 'user'])
        ]);
    }

    public function destroy($id)
    {
        $finance = Finance::findOrFail($id);
        $finance->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Transaksi berhasil dihapus'
        ]);
    }

    public function categories()
    {
        $categories = FinanceCategory::all();
        return response()->json([
            'status' => 'success',
            'data' => $categories
        ]);
    }
}
