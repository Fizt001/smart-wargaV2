<?php
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

// Disable foreign key checks
DB::statement('SET FOREIGN_KEY_CHECKS=0;');

// Truncate tables
DB::table('billing_details')->truncate();
DB::table('billings')->truncate();
DB::table('wallet_transactions')->truncate();
DB::table('finances')->truncate();
DB::table('routine_expense_records')->truncate();

// Reset wallets
DB::table('users')->update(['wallet_balance' => 0]);

// Enable foreign key checks
DB::statement('SET FOREIGN_KEY_CHECKS=1;');

// Delete directories (proofs, wallet_proofs, payment_proofs, routine_receipts)
Storage::disk('public')->deleteDirectory('payment_proofs');
Storage::disk('public')->deleteDirectory('wallet_proofs');
Storage::disk('public')->deleteDirectory('proofs');
Storage::disk('public')->deleteDirectory('routine_receipts');

// Recreate them empty
Storage::disk('public')->makeDirectory('payment_proofs');
Storage::disk('public')->makeDirectory('wallet_proofs');
Storage::disk('public')->makeDirectory('proofs');
Storage::disk('public')->makeDirectory('routine_receipts');

echo "Semua data tagihan, saldo, dan kas berhasil direset!\n";
