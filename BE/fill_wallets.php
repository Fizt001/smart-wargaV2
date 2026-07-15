<?php
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;

$wargas = User::where('role_id', 8)->get();
$count = 0;

DB::beginTransaction();
try {
    foreach ($wargas as $warga) {
        // Generate random balance between 0 and 1,000,000 in multiples of 50,000
        $randomBalance = rand(1, 20) * 50000;
        
        // Update user's wallet_balance
        $warga->wallet_balance = $randomBalance;
        $warga->save();

        // Create a transaction record for realism
        WalletTransaction::create([
            'user_id' => $warga->id,
            'type' => 'deposit',
            'amount' => $randomBalance,
            'status' => 'approved',
            'proof_of_payment' => null,
            'description' => 'Saldo awal'
        ]);

        $count++;
    }
    DB::commit();
    echo "Berhasil mengisi saldo untuk $count warga dengan nilai random maksimal 1 Juta.\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "Gagal: " . $e->getMessage() . "\n";
}
