<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Activity;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\ActivityParticipant;
use App\Models\ActivityDonation;
use App\Models\WalletTransaction;
use App\Models\Finance;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Activity::with(['user.role', 'rt', 'targetRts', 'participants', 'participants.user', 'donations', 'donations.user'])->orderBy('activity_date', 'desc')->orderBy('id', 'desc');

        if ($request->has('type') && $request->type != '') {
            $query->where('type', $request->type);
        }

        if (in_array($user->role_id, [3, 6, 7])) {
            // RT can see activities if:
            // 1. They created it (rt_id = user->rt_id)
            // 2. OR it's an RW activity targeting all RTs
            // 3. OR it's an RW activity specifically targeting this RT
            $query->where(function ($q) use ($user) {
                $q->where('rt_id', $user->rt_id)
                  ->orWhere(function ($q2) {
                      $q2->where('level', 'RW')->where('is_all_rt', true);
                  })
                  ->orWhereHas('targetRts', function ($q3) use ($user) {
                      $q3->where('rt_id', $user->rt_id);
                  });
            });
        } elseif ($request->has('rt_id') && $request->rt_id != '') {
            $query->where('rt_id', $request->rt_id);
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->get()
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:kegiatan,informasi',
            'description' => 'nullable|string',
            'activity_date' => 'nullable|date',
            'budget_proposed' => 'nullable|numeric|min:0',
            'is_all_rt' => 'boolean',
            'target_rts' => 'array',
            'target_rts.*' => 'integer|exists:rts,id',
        ]);

        $validated['user_id'] = $user->id;
        
        if (in_array($user->role_id, [3, 6, 7])) {
            $validated['rt_id'] = $user->rt_id;
            $validated['level'] = 'RT';
            $validated['is_all_rt'] = true; // For RT level, it's irrelevant, but we default to true to avoid logic bugs
        } else {
            $validated['level'] = 'RW';
            $validated['rt_id'] = null;
            $validated['is_all_rt'] = $request->input('is_all_rt', true);
        }
        
        $validated['status'] = 'planned';
        
        if (empty($validated['budget_proposed'])) {
            $validated['budget_proposed'] = 0;
        }
        
        if (empty($validated['activity_date'])) {
            $validated['activity_date'] = null;
        }

        // Extract target_rts before creating activity
        $targetRts = null;
        if (isset($validated['target_rts'])) {
            $targetRts = $validated['target_rts'];
            unset($validated['target_rts']);
        }

        $activity = Activity::create($validated);

        if ($activity->level === 'RW' && !$activity->is_all_rt && !empty($targetRts)) {
            $activity->targetRts()->sync($targetRts);
        }

        // Load the relationship for the response
        $activity->load('targetRts');

        return response()->json([
            'status' => 'success',
            'message' => 'Kegiatan berhasil direncanakan',
            'data' => $activity
        ], 201);
    }

    public function complete(Request $request, $id)
    {
        $user = auth()->user();
        $activity = Activity::findOrFail($id);

        if (in_array($user->role_id, [3, 6, 7]) && $activity->rt_id != $user->rt_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'actual_expense' => 'required|numeric|min:0',
            'receipt_proof' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
            'photo_proof' => 'nullable|file|mimes:jpeg,png,jpg|max:5120',
        ]);

        if ($request->hasFile('receipt_proof')) {
            if ($activity->receipt_proof) {
                Storage::disk('public')->delete($activity->receipt_proof);
            }
            $validated['receipt_proof'] = $request->file('receipt_proof')->store('proofs/receipts', 'public');
        }

        if ($request->hasFile('photo_proof')) {
            if ($activity->photo_proof) {
                Storage::disk('public')->delete($activity->photo_proof);
            }
            $validated['photo_proof'] = $request->file('photo_proof')->store('proofs/photos', 'public');
        }

        $validated['status'] = 'executed';

        DB::beginTransaction();
        try {
            $activity->update($validated);

            // Refund logic if there are donations
            $totalDonations = $activity->donations()->where('status', 'paid')->sum('amount');
            $actualExpense = $validated['actual_expense'];

            if ($totalDonations > $actualExpense && $activity->donations()->where('status', 'paid')->count() > 0) {
                $donors = $activity->donations()->where('status', 'paid')->get();
                $totalDonors = $donors->count();
                $remainingFunds = $totalDonations - $actualExpense;
                
                // Ubah status donasi menjadi utilized/closed agar rapi (tidak di-refund)
                $activity->donations()->where('status', 'paid')->update(['status' => 'utilized']);

                // Masukkan seluruh sisa dana ke Kas RT / RW
                Finance::create([
                    'finance_category_id' => 1, // Kategori umum / Pemasukan
                    'user_id' => clone $user->id,
                    'type' => 'income',
                    'amount' => $remainingFunds,
                    'description' => 'Sisa Donasi Kegiatan: ' . $activity->title,
                    'date' => now()->toDateString(),
                    // jika ada rt_id pada tabel finance, kita bisa set di sini
                    // Namun dari skema finances: ["id","finance_category_id","user_id","type","amount","description","date","created_at","updated_at"]
                    // Ternyata tidak ada kolom rt_id di finances, melainkan lewat user_id pembuatnya (yang merepresentasikan RT/RW)
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Kegiatan berhasil diselesaikan dan dicatat sebagai pengeluaran',
                'data' => $activity
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $user = auth()->user();
        $activity = Activity::findOrFail($id);

        // Authorization: who can delete this agenda?
        $canDelete = false;

        // 1. Superadmin can delete anything
        if ($user->role_id === 1) {
            $canDelete = true;
        }
        // 2. The creator can always delete their own agenda
        elseif ($activity->user_id === $user->id) {
            $canDelete = true;
        }
        // 3. Ketua RW can delete any agenda (RW or RT level)
        elseif ($user->role_id === 2) {
            $canDelete = true;
        }
        // 4. Ketua RT (role_id=3) can delete RT-level agendas within their own RT
        elseif ($user->role_id === 3 && $activity->level === 'RT' && $activity->rt_id === $user->rt_id) {
            $canDelete = true;
        }

        if (!$canDelete) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak memiliki izin untuk menghapus agenda ini.'], 403);
        }

        if ($activity->receipt_proof) Storage::disk('public')->delete($activity->receipt_proof);
        if ($activity->photo_proof) Storage::disk('public')->delete($activity->photo_proof);

        $activity->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Agenda berhasil dihapus'
        ]);
    }

    public function wargaAgendas(Request $request)
    {
        $user = auth()->user();
        
        $query = Activity::with(['user.role', 'rt', 'targetRts', 'participants' => function($q) use ($user) {
            $q->where('user_id', $user->id);
        }, 'donations' => function($q) use ($user) {
            $q->where('user_id', $user->id);
        }])->orderBy('activity_date', 'desc')->orderBy('id', 'desc');

        if ($request->has('type') && $request->type != '') {
            $query->where('type', $request->type);
        }

        // RW-level users (Superadmin, Ketua RW, Sekretaris RW, Bendahara RW) see ALL agendas
        // RT-level users (Ketua RT, Sekretaris RT, Bendahara RT) and Warga see only their RT's + RW-wide agendas
        if (!in_array($user->role_id, [1, 2, 4, 5])) {
            $query->where(function ($q) use ($user) {
                $q->where('rt_id', $user->rt_id)
                  ->orWhere(function ($q2) {
                      $q2->where('level', 'RW')->where('is_all_rt', true);
                  })
                  ->orWhereHas('targetRts', function ($q3) use ($user) {
                      $q3->where('rt_id', $user->rt_id);
                  });
            });
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->get()
        ]);
    }

    public function wargaRsvp(Request $request, $id)
    {
        $user = auth()->user();
        $activity = Activity::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:attending,absent',
            'reason' => 'nullable|string'
        ]);

        $participant = ActivityParticipant::updateOrCreate(
            ['activity_id' => $activity->id, 'user_id' => $user->id],
            ['status' => $validated['status'], 'reason' => $validated['status'] === 'absent' ? $validated['reason'] : null]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'RSVP berhasil disimpan',
            'data' => $participant
        ]);
    }

    public function wargaDonate(Request $request, $id)
    {
        $user = auth()->user();
        $activity = Activity::findOrFail($id);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:1000'
        ]);

        if ($user->wallet_balance < $validated['amount']) {
            return response()->json([
                'status' => 'error',
                'message' => 'Saldo Warga tidak mencukupi. Silakan isi saldo terlebih dahulu.'
            ], 400);
        }

        DB::beginTransaction();
        try {
            $user->wallet_balance -= $validated['amount'];
            $user->save();

            WalletTransaction::create([
                'user_id' => $user->id,
                'amount' => $validated['amount'],
                'type' => 'donation',
                'description' => 'Donasi Agenda: ' . $activity->title,
            ]);

            $donation = ActivityDonation::create([
                'activity_id' => $activity->id,
                'user_id' => $user->id,
                'amount' => $validated['amount'],
                'status' => 'paid',
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Donasi berhasil dilakukan',
                'data' => $donation
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
