<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\FamilyMember;
use App\Models\Activity;
use App\Models\Letter;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    private function getDemographics($query)
    {
        $members = $query->get();
        $balita = 0;
        $remaja = 0;
        $dewasa = 0;
        $lansia = 0;

        foreach ($members as $member) {
            if (!$member->birth_date) continue;
            $age = \Carbon\Carbon::parse($member->birth_date)->age;
            if ($age <= 5) $balita++;
            else if ($age <= 17) $remaja++;
            else if ($age <= 59) $dewasa++;
            else $lansia++;
        }

        return [
            'balita' => $balita,
            'remaja' => $remaja,
            'dewasa' => $dewasa,
            'lansia' => $lansia
        ];
    }

    public function getStats(Request $request)
    {
        $user = $request->user();
        $stats = [];
        $demographics = null;
        $alerts = null;

        if ($user->role_id == 6) { // Sekretaris RT
            $pendingRegistrations = User::where('rt_id', $user->rt_id)->where('registration_status', 'pending')->count();
            $pendingLetters = Letter::whereHas('user', function($q) use ($user) {
                $q->where('rt_id', $user->rt_id);
            })->where('status', 'pending')->count();

            if ($pendingRegistrations > 0 || $pendingLetters > 0) {
                $alerts = [
                    'role' => 'sekretaris',
                    'pending_registrations' => $pendingRegistrations,
                    'pending_letters' => $pendingLetters
                ];
            }
        } else if ($user->role_id == 7) { // Bendahara RT
            $pendingIpl = \App\Models\Billing::whereHas('user', function($q) use ($user) {
                $q->where('rt_id', $user->rt_id);
            })->where('status', 'pending_verification')->count();
            
            $pendingTopups = \App\Models\WalletTransaction::whereHas('user', function($q) use ($user) {
                $q->where('rt_id', $user->rt_id);
            })->where('status', 'pending')->count();

            if ($pendingIpl > 0 || $pendingTopups > 0) {
                $alerts = [
                    'role' => 'bendahara',
                    'pending_ipl' => $pendingIpl,
                    'pending_topups' => $pendingTopups
                ];
            }
        } else if ($user->role_id == 4) { // Sekretaris RW
            $pendingLettersRw = Letter::where('status', 'approved_rt')->count();

            if ($pendingLettersRw > 0) {
                $alerts = [
                    'role' => 'sekretaris_rw',
                    'pending_letters_rw' => $pendingLettersRw
                ];
            }
        } else if ($user->role_id == 3) { // Ketua RT
            $pendingMoveRequests = \App\Models\HouseMoveRequest::where(function ($q) use ($user) {
                $q->where('new_rt_id', $user->rt_id)
                  ->orWhere('old_rt_id', $user->rt_id);
            })->where('status', 'pending')->count();

            if ($pendingMoveRequests > 0) {
                $alerts = [
                    'role' => 'ketua_rt',
                    'pending_move_requests' => $pendingMoveRequests
                ];
            }
        }

        // --- WARGA (Role >= 8) ---
        if ($user->role_id >= 8) {
            // 1. Saldo Kas Warga
            $stats[] = [
                'title' => 'Saldo Kas Warga',
                'value' => 'Rp ' . number_format($user->wallet_balance, 0, ',', '.'),
                'icon' => 'WalletIcon',
                'color' => 'bg-blue-500',
                'trend' => 'Tersedia'
            ];

            // 2. Anggota Keluarga
            $familyCount = FamilyMember::whereHas('family', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })->count();
            $stats[] = [
                'title' => 'Total Anggota Keluarga',
                'value' => (string)$familyCount,
                'icon' => 'UsersIcon',
                'color' => 'bg-emerald-500',
                'trend' => 'Orang'
            ];

            // 3. Status IPL
            $currentMonth = date('n');
            $currentYear = date('Y');
            $ipl = \App\Models\Billing::where('user_id', $user->id)
                        ->where('month', $currentMonth)
                        ->where('year', $currentYear)
                        ->first();
            
            $iplStatus = 'Belum Ada Tagihan';
            if ($ipl) {
                if ($ipl->status === 'paid') $iplStatus = 'Lunas';
                else if ($ipl->status === 'pending_verification') $iplStatus = 'Menunggu Verifikasi';
                else $iplStatus = 'Belum Lunas';
            }

            $stats[] = [
                'title' => 'Status IPL',
                'value' => $iplStatus,
                'icon' => 'BanknotesIcon',
                'color' => $iplStatus === 'Lunas' ? 'bg-emerald-500' : ($iplStatus === 'Belum Ada Tagihan' ? 'bg-slate-500' : 'bg-amber-500'),
                'trend' => 'Bulan Ini'
            ];

            // 4. Agenda Warga
            $agendaCount = Activity::where('activity_date', '>=', now()->toDateString())->count();
            $stats[] = [
                'title' => 'Agenda Mendatang',
                'value' => (string)$agendaCount,
                'icon' => 'CalendarDaysIcon',
                'color' => 'bg-purple-500',
                'trend' => 'Kegiatan'
            ];

            // Demografi Keluarga Warga
            $demoQuery = FamilyMember::whereHas('family', function($q) use ($user) {
                $q->where('user_id', $user->id);
            });
            $demographics = $this->getDemographics($demoQuery);
        } 
        // --- PENGURUS RT (Role 3, 6, 7) ---
        else if (in_array($user->role_id, [3, 6, 7])) {
            // 1. Total KK RT
            $kkRT = User::where('role_id', '>=', 8)->where('rt_id', $user->rt_id)->count();
            $stats[] = [
                'title' => 'Total KK RT',
                'value' => (string)$kkRT,
                'icon' => 'HomeModernIcon',
                'color' => 'bg-blue-500',
                'trend' => 'Keluarga'
            ];

            // 1b. Total Warga RT (Anggota Keluarga)
            $wargaRT = FamilyMember::whereHas('family.user', function($q) use ($user) {
                $q->where('rt_id', $user->rt_id)->where('role_id', '>=', 8);
            })->count();
            $stats[] = [
                'title' => 'Total Warga RT',
                'value' => (string)$wargaRT,
                'icon' => 'UsersIcon',
                'color' => 'bg-indigo-500',
                'trend' => 'Jiwa'
            ];

            // 2. Total Kas RT (Gabungan Dompet Warga)
            $saldoRT = User::where('role_id', '>=', 8)->where('rt_id', $user->rt_id)->sum('wallet_balance');
            $stats[] = [
                'title' => 'Total Saldo Warga',
                'value' => 'Rp ' . number_format($saldoRT, 0, ',', '.'),
                'icon' => 'WalletIcon',
                'color' => 'bg-emerald-500',
                'trend' => 'Di RT Anda'
            ];

            // 3. Agenda RT
            $agendaRT = Activity::count();
            $stats[] = [
                'title' => 'Total Agenda',
                'value' => (string)$agendaRT,
                'icon' => 'CalendarDaysIcon',
                'color' => 'bg-amber-500',
                'trend' => 'Keseluruhan'
            ];

            // 4. Surat Menunggu (Simulasi jika ada tabel Letter)
            $suratRT = Letter::whereHas('user', function($q) use ($user) {
                $q->where('rt_id', $user->rt_id);
            })->where('status', 'pending')->count();
            
            $stats[] = [
                'title' => 'Surat Menunggu',
                'value' => (string)$suratRT,
                'icon' => 'DocumentTextIcon',
                'color' => 'bg-purple-500',
                'trend' => 'Butuh Konfirmasi'
            ];

            // Demografi Warga RT
            $demoQuery = FamilyMember::whereHas('family.user', function($q) use ($user) {
                $q->where('rt_id', $user->rt_id)
                  ->where('role_id', '>=', 8);
            });
            $demographics = $this->getDemographics($demoQuery);
        }
        // --- PENGURUS RW / SUPER ADMIN (Role 1, 2, 4, 5) ---
        else {
            // 1. Total KK
            $kkRW = User::where('role_id', '>=', 8)->count();
            $stats[] = [
                'title' => 'Total KK',
                'value' => (string)$kkRW,
                'icon' => 'HomeModernIcon',
                'color' => 'bg-blue-500',
                'trend' => 'Keluarga'
            ];

            // 1b. Total Warga (Anggota Keluarga)
            $wargaRW = FamilyMember::whereHas('family.user', function($q) {
                $q->where('role_id', '>=', 8);
            })->count();
            $stats[] = [
                'title' => 'Total Warga',
                'value' => (string)$wargaRW,
                'icon' => 'UsersIcon',
                'color' => 'bg-indigo-500',
                'trend' => 'Jiwa'
            ];

            // 2. Arus Kas Masuk (Finance Income + IPL + Donasi Kegiatan)
            $financeIncome = \App\Models\Finance::where('type', 'income')->sum('amount');
            $iplIncome = \App\Models\Billing::where('status', 'paid')->sum('total_amount');
            $donasiIncome = \App\Models\ActivityDonation::where('status', 'paid')->sum('amount');
            $kasMasuk = $financeIncome + $iplIncome + $donasiIncome;

            $stats[] = [
                'title' => 'Total Arus Kas Masuk',
                'value' => 'Rp ' . number_format($kasMasuk, 0, ',', '.'),
                'icon' => 'BanknotesIcon',
                'color' => 'bg-emerald-500',
                'trend' => 'Pemasukan'
            ];

            // 3. Arus Kas Keluar
            $kasKeluar = \App\Models\Finance::where('type', 'expense')->sum('amount');
            
            $stats[] = [
                'title' => 'Total Arus Kas Keluar',
                'value' => 'Rp ' . number_format($kasKeluar, 0, ',', '.'),
                'icon' => 'WalletIcon',
                'color' => 'bg-amber-500',
                'trend' => 'Pengeluaran'
            ];

            // 4. Surat Menunggu Keseluruhan
            $suratRW = Letter::where('status', 'pending')->count();
            $stats[] = [
                'title' => 'Surat Menunggu',
                'value' => (string)$suratRW,
                'icon' => 'DocumentTextIcon',
                'color' => 'bg-purple-500',
                'trend' => 'Se-RW'
            ];

            // 5. Pengaduan Warga (Pending/Processing)
            $pengaduan = \App\Models\Complaint::whereIn('status', ['pending', 'processing'])->count();
            $stats[] = [
                'title' => 'Pengaduan Aktif',
                'value' => (string)$pengaduan,
                'icon' => 'MegaphoneIcon',
                'color' => 'bg-red-500',
                'trend' => 'Perlu Tindakan'
            ];

            // 6. UMKM Aktif
            $umkm = \App\Models\UmkmBusiness::count();
            $stats[] = [
                'title' => 'Total UMKM',
                'value' => (string)$umkm,
                'icon' => 'ShoppingBagIcon',
                'color' => 'bg-orange-500',
                'trend' => 'Usaha Warga'
            ];

            // 7. Fasilitas & Aset
            $aset = \App\Models\Asset::sum('quantity');
            $stats[] = [
                'title' => 'Total Aset RT/RW',
                'value' => (string)$aset,
                'icon' => 'BuildingStorefrontIcon',
                'color' => 'bg-teal-500',
                'trend' => 'Unit Barang'
            ];

            // Demografi Warga Keseluruhan (Hanya Role Warga)
            $demoQuery = FamilyMember::whereHas('family.user', function($q) {
                $q->where('role_id', '>=', 8);
            });
            $demographics = $this->getDemographics($demoQuery);
        }

        // --- RECENT ACTIVITIES (Agenda) ---
        $recentActivitiesQuery = Activity::orderBy('created_at', 'desc');

        // Filter berdasarkan RT, kecuali role RW/Superadmin yang bisa melihat semua
        if (!in_array($user->role_id, [1, 2, 4, 5])) {
            $recentActivitiesQuery->where(function ($q) use ($user) {
                $q->where('rt_id', $user->rt_id)
                  ->orWhere(function ($q2) {
                      $q2->where('level', 'RW')->where('is_all_rt', true);
                  })
                  ->orWhereHas('targetRts', function ($q3) use ($user) {
                      $q3->where('rt_id', $user->rt_id);
                  });
            });
        }

        $recentActivities = $recentActivitiesQuery->take(4)->get();

        // --- REAL CHART DATA (Keuangan Tahun Ini) ---
        $currentYear = $request->input('year', date('Y'));
        
        $finances = \App\Models\Finance::selectRaw('MONTH(date) as month, type, SUM(amount) as total')
            ->whereYear('date', $currentYear)
            ->groupByRaw('MONTH(date), type')
            ->get();
            
        $billings = \App\Models\Billing::selectRaw('MONTH(paid_at) as month, SUM(total_amount) as total')
            ->where('status', 'paid')
            ->whereYear('paid_at', $currentYear)
            ->groupByRaw('MONTH(paid_at)')
            ->get();

        $labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        
        $pemasukan = array_fill(0, 12, 0);
        $pengeluaran = array_fill(0, 12, 0);

        foreach ($finances as $finance) {
            $monthIndex = (int)$finance->month - 1;
            if ($monthIndex >= 0 && $monthIndex < 12) {
                if ($finance->type === 'income') {
                    $pemasukan[$monthIndex] += (float)$finance->total;
                } else if ($finance->type === 'expense') {
                    $pengeluaran[$monthIndex] += (float)$finance->total;
                }
            }
        }
        
        foreach ($billings as $billing) {
            $monthIndex = (int)$billing->month - 1;
            if ($monthIndex >= 0 && $monthIndex < 12) {
                $pemasukan[$monthIndex] += (float)$billing->total;
            }
        }

        $chartData = [
            'labels' => $labels,
            'datasets' => [
                [
                    'label' => 'Pemasukan',
                    'data' => $pemasukan,
                    'borderColor' => '#10b981',
                    'backgroundColor' => 'rgba(16, 185, 129, 0.2)'
                ],
                [
                    'label' => 'Pengeluaran',
                    'data' => $pengeluaran,
                    'borderColor' => '#ef4444',
                    'backgroundColor' => 'rgba(239, 68, 68, 0.2)'
                ]
            ]
        ];

        return response()->json([
            'status' => 'success',
            'data' => [
                'stats' => $stats,
                'demographics' => $demographics,
                'recent_activities' => $recentActivities,
                'chart_data' => $chartData,
                'alerts' => $alerts
            ]
        ]);
    }
}
