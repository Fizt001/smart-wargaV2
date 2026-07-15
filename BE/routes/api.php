<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\RoutineExpenseController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Public routes
Route::get('/public/rts', [\App\Http\Controllers\WilayahController::class, 'getPublicRts']);
Route::get('/public/blocks/{rt_id}', [\App\Http\Controllers\WilayahController::class, 'getPublicBlocks']);
Route::get('/public/houses/{block_id}', [\App\Http\Controllers\WilayahController::class, 'getPublicHouses']);
Route::get('/public/app-config', [\App\Http\Controllers\SettingController::class, 'getPublicConfig']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user()->load(['role', 'rt', 'house.block']);
    });
    
    // Dashboard Stats
    Route::get('/dashboard/stats', [\App\Http\Controllers\DashboardController::class, 'getStats']);
    
    // API Resources
    Route::apiResource('users', \App\Http\Controllers\UserController::class);
    Route::get('pending-approvals', [\App\Http\Controllers\UserController::class, 'getPendingApprovals']);
    Route::put('users/{id}/approve', [\App\Http\Controllers\UserController::class, 'approveUser']);
    Route::delete('users/{id}/reject', [\App\Http\Controllers\UserController::class, 'rejectUser']);
    
    Route::get('finances/categories', [\App\Http\Controllers\FinanceController::class, 'categories']);
    Route::apiResource('finances', \App\Http\Controllers\FinanceController::class);

    // Kegiatan
    Route::apiResource('activities', ActivityController::class);
    Route::post('/activities/{activity}/complete', [ActivityController::class, 'complete']);

    // Agenda Warga & RSVP & Donasi
    Route::get('/warga/agendas', [ActivityController::class, 'wargaAgendas']);
    Route::post('/warga/agendas/{activity}/rsvp', [ActivityController::class, 'wargaRsvp']);
    Route::post('/warga/agendas/{activity}/donate', [ActivityController::class, 'wargaDonate']);

    // Saldo Warga (Dompet)
    Route::get('/wallets/all', [\App\Http\Controllers\WalletController::class, 'allWallets']);
    Route::get('/wallet', [\App\Http\Controllers\WalletController::class, 'index']);
    Route::get('/wallet/pending', [\App\Http\Controllers\WalletController::class, 'pendingTopups']);
    Route::post('/wallet/topup', [\App\Http\Controllers\WalletController::class, 'topup']);
    Route::post('/wallet/topup/{id}/approve', [\App\Http\Controllers\WalletController::class, 'approveTopup']);
    Route::post('/wallet/topup/{id}/reject', [\App\Http\Controllers\WalletController::class, 'rejectTopup']);

    // Pengeluaran Rutin
    Route::apiResource('routine-expenses', RoutineExpenseController::class);

    // Profil Keluarga
    Route::get('/families', [\App\Http\Controllers\FamilyController::class, 'index']);
    Route::post('/families', [\App\Http\Controllers\FamilyController::class, 'storeFamily']);
    Route::post('/families/{family}/members', [\App\Http\Controllers\FamilyController::class, 'storeMember']);
    Route::put('/families/{family}/members/{member}', [\App\Http\Controllers\FamilyController::class, 'updateMember']);
    Route::post('/routine-expenses/{id}/pay', [RoutineExpenseController::class, 'pay']);

    // Pindah Rumah (Mutasi)
    Route::get('/house-move-requests', [\App\Http\Controllers\HouseMoveRequestController::class, 'index']);
    Route::post('/house-move-requests', [\App\Http\Controllers\HouseMoveRequestController::class, 'store']);
    Route::put('/house-move-requests/{id}/approve', [\App\Http\Controllers\HouseMoveRequestController::class, 'approve']);
    Route::put('/house-move-requests/{id}/reject', [\App\Http\Controllers\HouseMoveRequestController::class, 'reject']);

    Route::apiResource('letters', \App\Http\Controllers\LetterController::class);
    Route::apiResource('letter-types', \App\Http\Controllers\LetterTypeController::class);
    Route::put('letter-types/{id}/template', [\App\Http\Controllers\LetterTypeController::class, 'updateTemplate']);

    // Complaints
    Route::get('complaints', [\App\Http\Controllers\ComplaintController::class, 'index']);
    Route::post('complaints', [\App\Http\Controllers\ComplaintController::class, 'store']);
    Route::put('complaints/{id}/status', [\App\Http\Controllers\ComplaintController::class, 'updateStatus']);
    Route::delete('complaints/{id}', [\App\Http\Controllers\ComplaintController::class, 'destroy']);

    // Assets
    Route::apiResource('assets', \App\Http\Controllers\AssetController::class);
    // Asset Borrowings
    Route::get('asset-borrowings', [\App\Http\Controllers\AssetBorrowingController::class, 'index']);
    Route::post('asset-borrowings', [\App\Http\Controllers\AssetBorrowingController::class, 'store']);
    Route::patch('asset-borrowings/{id}/status', [\App\Http\Controllers\AssetBorrowingController::class, 'updateStatus']);
    Route::post('asset-borrowings/{id}/return', [\App\Http\Controllers\AssetBorrowingController::class, 'returnAsset']);

    // Kesehatan (Posyandu)
    Route::get('health-records', [\App\Http\Controllers\HealthRecordController::class, 'index']);
    Route::post('health-records', [\App\Http\Controllers\HealthRecordController::class, 'store']);

    // Rukun Kematian
    Route::get('death-records', [\App\Http\Controllers\DeathRecordController::class, 'index']);
    Route::post('death-records', [\App\Http\Controllers\DeathRecordController::class, 'store']);
    Route::patch('death-records/{id}/status', [\App\Http\Controllers\DeathRecordController::class, 'updateStatus']);

    // Bank Sampah
    Route::get('waste-deposits', [\App\Http\Controllers\WasteDepositController::class, 'index']);
    Route::post('waste-deposits', [\App\Http\Controllers\WasteDepositController::class, 'store']);
    Route::patch('waste-deposits/{id}/status', [\App\Http\Controllers\WasteDepositController::class, 'updateStatus']);

    // UMKM
    Route::get('umkm-businesses', [\App\Http\Controllers\UmkmBusinessController::class, 'index']);
    Route::post('umkm-businesses', [\App\Http\Controllers\UmkmBusinessController::class, 'store']);
    Route::patch('umkm-businesses/{id}/status', [\App\Http\Controllers\UmkmBusinessController::class, 'updateStatus']);

    // Koperasi
    Route::get('cooperative-transactions', [\App\Http\Controllers\CooperativeTransactionController::class, 'index']);
    Route::post('cooperative-transactions', [\App\Http\Controllers\CooperativeTransactionController::class, 'store']);
    Route::patch('cooperative-transactions/{id}/status', [\App\Http\Controllers\CooperativeTransactionController::class, 'updateStatus']);

    // Settings
    Route::get('settings', [\App\Http\Controllers\SettingController::class, 'index']);
    Route::post('settings/bulk', [\App\Http\Controllers\SettingController::class, 'updateBulk']);

    // Security
    Route::get('security-schedules', [\App\Http\Controllers\SecurityScheduleController::class, 'index']);
    Route::post('security-schedules', [\App\Http\Controllers\SecurityScheduleController::class, 'store']);
    Route::put('security-schedules/{id}/status', [\App\Http\Controllers\SecurityScheduleController::class, 'updateStatus']);
    
    Route::get('security-logs', [\App\Http\Controllers\SecurityLogController::class, 'index']);
    Route::post('security-logs', [\App\Http\Controllers\SecurityLogController::class, 'store']);
    Route::put('security-logs/{id}/status', [\App\Http\Controllers\SecurityLogController::class, 'updateStatus']);

    Route::put('/user/profile', [\App\Http\Controllers\ProfileController::class, 'updateProfile']);
    Route::put('/user/password', [\App\Http\Controllers\ProfileController::class, 'updatePassword']);

    // Master Wilayah
    Route::get('/rts', [\App\Http\Controllers\WilayahController::class, 'getRts']);
    Route::post('/rts', [\App\Http\Controllers\WilayahController::class, 'storeRt']);
    Route::put('/rts/{id}', [\App\Http\Controllers\WilayahController::class, 'updateRt']);
    Route::delete('/rts/{id}', [\App\Http\Controllers\WilayahController::class, 'deleteRt']);
    Route::get('/blocks', [\App\Http\Controllers\WilayahController::class, 'getBlocks']);
    Route::post('/blocks', [\App\Http\Controllers\WilayahController::class, 'storeBlock']);
    Route::put('/blocks/{id}', [\App\Http\Controllers\WilayahController::class, 'updateBlock']);
    Route::delete('/blocks/{id}', [\App\Http\Controllers\WilayahController::class, 'deleteBlock']);
    Route::get('/blocks/{id}/houses', [\App\Http\Controllers\WilayahController::class, 'getHouses']);
    Route::post('/blocks/{id}/generate-houses', [\App\Http\Controllers\WilayahController::class, 'generateHouses']);
    Route::delete('/houses/{id}', [\App\Http\Controllers\WilayahController::class, 'deleteHouse']);

    // Keuangan & IPL
    Route::apiResource('payment-methods', \App\Http\Controllers\PaymentMethodController::class);
    Route::apiResource('billing-components', \App\Http\Controllers\BillingComponentController::class);
    Route::get('/billings', [\App\Http\Controllers\BillingController::class, 'index']);
    Route::post('/billings/generate', [\App\Http\Controllers\BillingController::class, 'generate']);
    Route::post('/billings/pay-multiple', [\App\Http\Controllers\BillingController::class, 'payMultiple']);
    Route::post('/billings/pay-multiple-with-wallet', [\App\Http\Controllers\BillingController::class, 'payMultipleWithWallet']);
    Route::post('/billings/{id}/pay', [\App\Http\Controllers\BillingController::class, 'pay']);
    Route::post('/billings/{id}/pay-with-wallet', [\App\Http\Controllers\BillingController::class, 'payWithWallet']);
    Route::put('/billings/{id}/verify', [\App\Http\Controllers\BillingController::class, 'verify']);

    // Setoran RW
    Route::get('/rw-deposits', [\App\Http\Controllers\RwDepositController::class, 'index']);
    Route::post('/rw-deposits', [\App\Http\Controllers\RwDepositController::class, 'store']);
    Route::put('/rw-deposits/{id}/verify', [\App\Http\Controllers\RwDepositController::class, 'verify']);

    Route::apiResource('religions', \App\Http\Controllers\ReligionController::class);
    Route::apiResource('marital-statuses', \App\Http\Controllers\MaritalStatusController::class);
    Route::apiResource('profession-categories', \App\Http\Controllers\ProfessionCategoryController::class);
    Route::apiResource('family-relation-statuses', \App\Http\Controllers\FamilyRelationStatusController::class);

    Route::get('/master-data', [\App\Http\Controllers\MasterDataController::class, 'index']);
});
