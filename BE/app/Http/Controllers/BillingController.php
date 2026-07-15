<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class BillingController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        
        $query = \App\Models\Billing::with(['user', 'user.rt', 'user.block', 'user.house', 'details'])->latest();

        if ($user->role_id == 8) {
            // Warga sees own bills
            $query->where('user_id', $user->id);
        } elseif (in_array($user->role_id, [3, 6, 7])) {
            // RT sees their RT's bills
            $query->whereHas('user', function($q) use ($user) {
                $q->where('rt_id', $user->rt_id);
            });
        } elseif ($user->role_id == 1) {
            // SA sees all
        } elseif (in_array($user->role_id, [2, 4, 5])) {
            // RW shouldn't see warga bills directly
            return response()->json(['status' => 'success', 'data' => [], 'meta' => ['total' => 0, 'current_page' => 1, 'last_page' => 1]]);
        } else {
            return response()->json(['status' => 'success', 'data' => []]);
        }

        if ($request->has('month')) {
            $query->where('month', $request->month);
        }
        if ($request->has('year')) {
            $query->where('year', $request->year);
        }
        
        if ($request->has('rt_id') && $request->rt_id != '') {
            $query->whereHas('user', function($q) use ($request) {
                $q->where('rt_id', $request->rt_id);
            });
        }

        if ($request->has('status') && $request->status != '') {
            $query->where('status', $request->status);
        }

        $pendingQuery = $query->clone();
        $pendingCount = $pendingQuery->where('status', 'pending_verification')->count();

        $paginator = $query->paginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
                'pending_count' => $pendingCount,
            ]
        ]);
    }

    public function generate(Request $request)
    {
        $user = auth()->user();
        
        // Only RT (Ketua/Sekretaris/Bendahara) or SA can generate
        if (!in_array($user->role_id, [1, 3, 6, 7])) {
            return response()->json(['message' => 'Hanya pengurus tingkat RT yang dapat men-generate tagihan.'], 403);
        }

        $validated = $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020|max:2099',
        ]);

        $month = $validated['month'];
        $year = $validated['year'];

        // Get active Warga. If RT, only their own Warga.
        $wargasQuery = \App\Models\User::where('role_id', 8)
            ->where('is_approved', true)
            ->whereHas('family', function($q) {
                $q->where('type', 'inti');
            });
            
        if (in_array($user->role_id, [3, 6, 7])) {
            $wargasQuery->where('rt_id', $user->rt_id);
        }
        $wargas = $wargasQuery->get();

        // Get all active components
        $rwComponents = \App\Models\BillingComponent::where('level', 'RW')->where('is_active', true)->get();
        $rtComponents = \App\Models\BillingComponent::where('level', 'RT')->where('is_active', true)->get()->groupBy('rt_id');

        $generatedCount = 0;

        foreach ($wargas as $warga) {
            // Check if billing already exists for this user, month, and year
            $exists = \App\Models\Billing::where('user_id', $warga->id)
                ->where('month', $month)
                ->where('year', $year)
                ->exists();

            if ($exists) {
                continue; // Skip if already generated
            }

            $userRtComponents = isset($rtComponents[$warga->rt_id]) ? $rtComponents[$warga->rt_id] : collect();
            
            $totalAmount = 0;
            $details = [];

            // Add RW Components
            foreach ($rwComponents as $comp) {
                $totalAmount += $comp->amount;
                $details[] = [
                    'component_name' => $comp->name,
                    'amount' => $comp->amount,
                ];
            }

            // Add RT Components
            foreach ($userRtComponents as $comp) {
                $totalAmount += $comp->amount;
                $details[] = [
                    'component_name' => $comp->name,
                    'amount' => $comp->amount,
                ];
            }

            // Create Billing
            $billing = \App\Models\Billing::create([
                'user_id' => $warga->id,
                'month' => $month,
                'year' => $year,
                'total_amount' => $totalAmount,
                'status' => 'unpaid',
                'generated_by' => $user->id,
            ]);

            // Create Details
            foreach ($details as $detail) {
                \App\Models\BillingDetail::create([
                    'billing_id' => $billing->id,
                    'component_name' => $detail['component_name'],
                    'amount' => $detail['amount'],
                ]);
            }

            $generatedCount++;
        }

        return response()->json([
            'status' => 'success',
            'message' => "Berhasil men-generate $generatedCount tagihan untuk bulan $month tahun $year."
        ]);
    }

    public function payMultiple(Request $request)
    {
        $user = auth()->user();
        
        $request->validate([
            'billing_ids' => 'required|array',
            'billing_ids.*' => 'exists:billings,id',
            'proof_image' => 'required|image|mimes:jpeg,png,jpg|max:5120',
        ]);

        $billings = \App\Models\Billing::whereIn('id', $request->billing_ids)->get();

        foreach ($billings as $billing) {
            if ($billing->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            if ($billing->status !== 'unpaid') {
                return response()->json(['message' => "Tagihan bulan {$billing->month} sudah diproses sebelumnya."], 400);
            }
        }

        if ($request->hasFile('proof_image')) {
            $path = $request->file('proof_image')->store('payment_proofs', 'public');
            
            \App\Models\Billing::whereIn('id', $request->billing_ids)->update([
                'proof_image_path' => $path,
                'status' => 'pending_verification',
                'paid_at' => now(),
            ]);
            
            return response()->json(['message' => 'Bukti pembayaran berhasil diunggah untuk tagihan yang dipilih. Menunggu verifikasi pengurus.']);
        }

        return response()->json(['message' => 'Gagal mengunggah bukti pembayaran.'], 400);
    }

    public function payMultipleWithWallet(Request $request)
    {
        $user = auth()->user();
        
        $request->validate([
            'billing_ids' => 'required|array',
            'billing_ids.*' => 'exists:billings,id',
        ]);

        $billings = \App\Models\Billing::whereIn('id', $request->billing_ids)->get();
        $totalAmount = 0;
        $monthNames = [];

        foreach ($billings as $billing) {
            if ($billing->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            if ($billing->status !== 'unpaid') {
                return response()->json(['message' => "Tagihan bulan {$billing->month} sudah diproses sebelumnya."], 400);
            }
            $totalAmount += $billing->total_amount;
            $monthNames[] = "{$billing->month}/{$billing->year}";
        }

        if ($user->wallet_balance < $totalAmount) {
            return response()->json(['message' => 'Saldo dompet tidak mencukupi untuk total tagihan ini.'], 400);
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            // Deduct balance
            $user->wallet_balance -= $totalAmount;
            $user->save();

            // Record transaction
            $monthStr = implode(', ', $monthNames);
            \App\Models\WalletTransaction::create([
                'user_id' => $user->id,
                'amount' => -$totalAmount,
                'type' => 'withdrawal',
                'description' => "Pembayaran Tagihan IPL Bulan {$monthStr}",
            ]);

            // Update billings
            \App\Models\Billing::whereIn('id', $request->billing_ids)->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            \Illuminate\Support\Facades\DB::commit();
            return response()->json(['message' => 'Pembayaran multi-bulan berhasil menggunakan Saldo Warga. Tagihan Lunas.']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Gagal memproses pembayaran. ' . $e->getMessage()], 500);
        }
    }

    public function pay(Request $request, string $id)
    {
        $user = auth()->user();
        $billing = \App\Models\Billing::findOrFail($id);

        if ($billing->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'proof_image' => 'required|image|mimes:jpeg,png,jpg|max:5120',
        ]);

        if ($request->hasFile('proof_image')) {
            $path = $request->file('proof_image')->store('payment_proofs', 'public');
            $billing->update([
                'proof_image_path' => $path,
                'status' => 'pending_verification',
                'paid_at' => now(),
            ]);
            return response()->json(['message' => 'Bukti pembayaran berhasil diunggah. Menunggu verifikasi pengurus.']);
        }

        return response()->json(['message' => 'Gagal mengunggah bukti pembayaran.'], 400);
    }

    public function payWithWallet(Request $request, string $id)
    {
        $user = auth()->user();
        $billing = \App\Models\Billing::findOrFail($id);

        if ($billing->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->wallet_balance < $billing->total_amount) {
            return response()->json(['message' => 'Saldo dompet tidak mencukupi.'], 400);
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            // Deduct balance
            $user->wallet_balance -= $billing->total_amount;
            $user->save();

            // Record transaction
            \App\Models\WalletTransaction::create([
                'user_id' => $user->id,
                'amount' => -$billing->total_amount,
                'type' => 'withdrawal',
                'description' => "Pembayaran Tagihan IPL Bulan {$billing->month} / {$billing->year}",
            ]);

            // Update billing (Directly Paid, no need for verify)
            $billing->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            \Illuminate\Support\Facades\DB::commit();
            return response()->json(['message' => 'Pembayaran berhasil menggunakan Saldo Warga. Tagihan Lunas.']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['message' => 'Gagal memproses pembayaran. ' . $e->getMessage()], 500);
        }
    }

    public function verify(Request $request, string $id)
    {
        $user = auth()->user();
        $billing = \App\Models\Billing::with('user')->findOrFail($id);

        // RT verification logic (User role 3, 6, 7 and must be from the same RT)
        if (in_array($user->role_id, [3, 6, 7]) && $user->rt_id == $billing->user->rt_id) {
            // allowed
        } elseif ($user->role_id == 1) {
            // SA allowed
        } else {
            return response()->json(['message' => 'Hanya Pengurus RT terkait yang dapat memverifikasi pembayaran.'], 403);
        }

        $request->validate([
            'status' => 'required|in:paid,unpaid'
        ]);

        // If unpaid (rejected), we can optionally nullify the proof or leave it for history.
        // We'll leave it but change status back to unpaid.
        $billing->update([
            'status' => $request->status,
        ]);

        $statusMsg = $request->status == 'paid' ? 'diverifikasi (Lunas)' : 'ditolak (Belum Lunas)';

        return response()->json(['message' => "Pembayaran berhasil $statusMsg."]);
    }
}
