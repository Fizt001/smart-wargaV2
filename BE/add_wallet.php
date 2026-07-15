<?php

use App\Models\User;
use App\Models\WalletTransaction;

// 1. Reset all wallet balances and delete transactions
$allWarga = User::where('role_id', 8)->get();
foreach ($allWarga as $w) {
    $w->wallet_balance = 0;
    $w->save();
}
WalletTransaction::where('description', 'Isi saldo awal otomatis')->delete();

// 2. Give balance ONLY to KK Utama (Family type = 'inti')
$kkUtama = User::where('role_id', 8)
    ->whereHas('family', function($q) {
        $q->where('type', 'inti');
    })->get();

$count = 0;
foreach ($kkUtama as $u) {
    // Random amount between 100,000 and 1,000,000, stepping by 50,000
    $amount = rand(2, 20) * 50000;
    
    $u->wallet_balance = $amount;
    $u->save();
    
    WalletTransaction::create([
        'user_id' => $u->id,
        'amount' => $amount,
        'type' => 'deposit',
        'status' => 'approved',
        'description' => 'Isi saldo awal otomatis',
        'created_at' => now()->subDays(rand(1, 30)),
        'updated_at' => now()
    ]);
    
    $count++;
}

echo "Reset done. Successfully added wallet balances for {$count} KK Utama!";
