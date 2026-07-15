"use client";

import { useEffect, useState } from "react";
import { 
  UsersIcon, 
  BanknotesIcon, 
  DocumentTextIcon, 
  HomeModernIcon,
  CalendarDaysIcon,
  WalletIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
  ShoppingBagIcon,
  BuildingStorefrontIcon
} from "@heroicons/react/24/outline";

const iconMap: Record<string, any> = {
  UsersIcon,
  BanknotesIcon,
  DocumentTextIcon,
  HomeModernIcon,
  CalendarDaysIcon,
  WalletIcon,
  MegaphoneIcon,
  ShoppingBagIcon,
  BuildingStorefrontIcon
};

const colorMap: Record<string, { bg: string; shadow: string; gradient: string }> = {
  'bg-blue-500': { bg: 'bg-blue-500', shadow: 'shadow-blue-500/30', gradient: 'from-blue-50/50' },
  'bg-indigo-500': { bg: 'bg-indigo-500', shadow: 'shadow-indigo-500/30', gradient: 'from-indigo-50/50' },
  'bg-emerald-500': { bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/30', gradient: 'from-emerald-50/50' },
  'bg-amber-500': { bg: 'bg-amber-500', shadow: 'shadow-amber-500/30', gradient: 'from-amber-50/50' },
  'bg-purple-500': { bg: 'bg-purple-500', shadow: 'shadow-purple-500/30', gradient: 'from-purple-50/50' },
  'bg-red-500': { bg: 'bg-red-500', shadow: 'shadow-red-500/30', gradient: 'from-red-50/50' },
  'bg-orange-500': { bg: 'bg-orange-500', shadow: 'shadow-orange-500/30', gradient: 'from-orange-50/50' },
  'bg-teal-500': { bg: 'bg-teal-500', shadow: 'shadow-teal-500/30', gradient: 'from-teal-50/50' },
  'bg-slate-500': { bg: 'bg-slate-500', shadow: 'shadow-slate-500/30', gradient: 'from-slate-50/50' },
};

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [demographics, setDemographics] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [chartYear, setChartYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const token = localStorage.getItem("token");
        if (token) {
          const res = await fetch(`${apiUrl}/api/user`, {
            headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
          });
          const data = await res.json();
          setUser(data.data || data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    const fetchStats = async (silent = false) => {
      try {
        if (!silent) setIsLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const token = localStorage.getItem("token");
        if (token) {
          const res = await fetch(`${apiUrl}/api/dashboard/stats?year=${chartYear}`, {
            headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
          });
          const data = await res.json();
          if (data.status === 'success') {
            setStats(data.data.stats || []);
            setDemographics(data.data.demographics || null);
            setRecentActivities(data.data.recent_activities || []);
            setChartData(data.data.chart_data || null);
            setAlerts(data.data.alerts || null);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!silent) setIsLoading(false);
      }
    };
    
    fetchUser();
    fetchStats();

    const interval = setInterval(() => {
      fetchStats(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [chartYear]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Selamat datang, {user?.name || "Warga"}! 👋</h1>
        {user && ![1, 2, 4, 5].includes(user.role_id) && (
          <div className="flex items-center gap-3 mt-2 text-slate-600">
            {/* Tampilkan badge RT untuk role RT (3, 6, 7) dan Warga (>= 8). Sembunyikan untuk SA/RW (1, 2, 4, 5) */}
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold border border-blue-100">
              {user?.rt ? user.rt.name : 'Belum ada RT'}
            </span>
            
            {/* Tampilkan badge Rumah hanya untuk Warga (>= 8). Sembunyikan untuk pengurus RT dan SA/RW */}
            {user.role_id >= 8 && (
              <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold border border-indigo-100">
                {user?.house?.block?.name ? `${user.house.block.name}` : ''} No. {user?.house?.number || '-'}
              </span>
            )}
          </div>
        )}
      </div>

      {alerts && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-bold text-amber-800">Perhatian: Ada tugas yang menunggu persetujuan Anda</h3>
              <div className="mt-2 text-sm text-amber-700">
                <ul className="list-disc pl-5 space-y-1">
                  {alerts.role === 'sekretaris' && (
                    <>
                      {alerts.pending_registrations > 0 && (
                        <li>Ada <strong>{alerts.pending_registrations} warga</strong> baru yang menunggu persetujuan pendaftaran. <a href="/dashboard/warga" className="font-medium underline hover:text-amber-600">Lihat Detail</a></li>
                      )}
                      {alerts.pending_letters > 0 && (
                        <li>Ada <strong>{alerts.pending_letters} permohonan surat</strong> yang menunggu persetujuan RT. <a href="/dashboard/surat" className="font-medium underline hover:text-amber-600">Lihat Detail</a></li>
                      )}
                    </>
                  )}
                  {alerts.role === 'bendahara' && (
                    <>
                      {alerts.pending_ipl > 0 && (
                        <li>Ada <strong>{alerts.pending_ipl} pembayaran IPL</strong> yang menunggu verifikasi Anda. <a href="/dashboard/ipl" className="font-medium underline hover:text-amber-600">Lihat Detail</a></li>
                      )}
                      {alerts.pending_topups > 0 && (
                        <li>Ada <strong>{alerts.pending_topups} permintaan top-up dompet</strong> yang menunggu persetujuan Anda. <a href="/dashboard/dompet-warga" className="font-medium underline hover:text-amber-600">Lihat Detail</a></li>
                      )}
                    </>
                  )}
                  {alerts.role === 'sekretaris_rw' && (
                    <>
                      {alerts.pending_letters_rw > 0 && (
                        <li>Ada <strong>{alerts.pending_letters_rw} permohonan surat</strong> dari RT yang menunggu persetujuan RW. <a href="/dashboard/surat" className="font-medium underline hover:text-amber-600">Lihat Detail</a></li>
                      )}
                    </>
                  )}
                  {alerts.role === 'ketua_rt' && (
                    <>
                      {alerts.pending_move_requests > 0 && (
                        <li>Ada <strong>{alerts.pending_move_requests} pengajuan pindah rumah</strong> yang menunggu konfirmasi Anda. <a href="/dashboard/keluarga" className="font-medium underline hover:text-amber-600">Lihat Detail</a></li>
                      )}
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {isLoading ? (
          <div className="col-span-full py-10 text-center text-slate-500">Memuat data statistik...</div>
        ) : stats.length === 0 ? (
          <div className="col-span-full py-10 text-center text-slate-500">Belum ada data statistik tersedia.</div>
        ) : (
          stats.map((stat, idx) => {
            const Icon = iconMap[stat.icon] || DocumentTextIcon;
            const styleConfig = colorMap[stat.color] || colorMap['bg-blue-500'];
            
            return (
              <div key={idx} className="bg-white rounded-xl p-3 sm:p-5 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.15)] transition-all duration-300 relative overflow-hidden group flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
                <div className={`absolute top-0 right-0 w-32 h-full bg-gradient-to-l ${styleConfig.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
                
                <div className={`flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-[14px] flex items-center justify-center text-white ${styleConfig.bg} shadow-lg ${styleConfig.shadow} transform group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300 relative z-10`}>
                  <Icon className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                
                <div className="flex-1 min-w-0 relative z-10 w-full">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-0.5 gap-1 sm:gap-0">
                    <h3 className="text-slate-500 font-bold text-[10px] sm:text-xs uppercase tracking-wider truncate mr-0 sm:mr-2">{stat.title}</h3>
                    {stat.trend && (
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 whitespace-nowrap self-start sm:self-auto">{stat.trend}</span>
                    )}
                  </div>
                  <p className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight truncate">{stat.value}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kiri: Demografi & Grafik */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Area Demografi */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Demografi Keluarga (Berdasarkan Umur)</h3>
            </div>
            {demographics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center">
                  <p className="text-sm font-medium text-orange-600 mb-1">Balita (0-5 thn)</p>
                  <p className="text-3xl font-bold text-orange-700">{demographics.balita}</p>
                  <p className="text-xs text-orange-500 mt-1">Orang</p>
                </div>
                <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 text-center">
                  <p className="text-sm font-medium text-teal-600 mb-1">Anak/Remaja (6-17 thn)</p>
                  <p className="text-3xl font-bold text-teal-700">{demographics.remaja}</p>
                  <p className="text-xs text-teal-500 mt-1">Orang</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                  <p className="text-sm font-medium text-indigo-600 mb-1">Dewasa (18-59 thn)</p>
                  <p className="text-3xl font-bold text-indigo-700">{demographics.dewasa}</p>
                  <p className="text-xs text-indigo-500 mt-1">Orang</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <p className="text-sm font-medium text-slate-600 mb-1">Lansia (60+ thn)</p>
                  <p className="text-3xl font-bold text-slate-700">{demographics.lansia}</p>
                  <p className="text-xs text-slate-500 mt-1">Orang</p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                <p className="text-slate-400 font-medium">Memuat data demografi...</p>
              </div>
            )}
          </div>

          {/* Area Grafik */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Grafik Keuangan / Kas</h3>
              <select 
                value={chartYear}
                onChange={(e) => setChartYear(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[0, 1, 2, 3, 4].map(offset => {
                  const year = new Date().getFullYear() - offset;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
            
            {chartData ? (
               <div className="h-64 flex flex-col justify-end border-b-2 border-l-2 border-slate-200 pl-2 pb-2 relative">
                  <div className="flex h-full w-full items-end justify-between gap-1 sm:gap-2 pr-2">
                    {chartData.labels.map((label: string, index: number) => {
                      const maxVal = Math.max(...chartData.datasets[0].data, ...chartData.datasets[1].data) || 1;
                      const inHeight = (chartData.datasets[0].data[index] / maxVal) * 100;
                      const outHeight = (chartData.datasets[1].data[index] / maxVal) * 100;
                      
                      return (
                        <div key={index} className="flex flex-col items-center flex-1 group relative">
                           <div className="flex items-end space-x-px sm:space-x-1 w-full h-56 justify-center">
                              <div style={{ height: `${inHeight}%` }} className="w-2 sm:w-3 md:w-4 lg:w-6 bg-emerald-400 rounded-t-sm opacity-80 hover:opacity-100 transition-all cursor-pointer"></div>
                              <div style={{ height: `${outHeight}%` }} className="w-2 sm:w-3 md:w-4 lg:w-6 bg-red-400 rounded-t-sm opacity-80 hover:opacity-100 transition-all cursor-pointer"></div>
                           </div>
                           <span className="text-[10px] sm:text-xs text-slate-500 mt-2 font-medium">{label}</span>
                           <div className="absolute -top-10 hidden group-hover:block bg-slate-800 text-white text-xs p-2 rounded shadow-lg whitespace-nowrap z-10">
                              In: Rp {(chartData.datasets[0].data[index]/1000).toFixed(0)}k | Out: Rp {(chartData.datasets[1].data[index]/1000).toFixed(0)}k
                           </div>
                        </div>
                      )
                    })}
                  </div>
               </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                <p className="text-slate-400 font-medium">Area Grafik</p>
              </div>
            )}
          </div>
        </div>

        {/* Kanan: Recent Activities (Agenda) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col h-full">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Agenda / Kegiatan Terkini</h3>
          <div className="space-y-6 flex-1 overflow-y-auto">
            {recentActivities.length > 0 ? recentActivities.map((act) => (
              <div key={act.id} className="flex space-x-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                  <CalendarDaysIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{act.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{act.level === 'RW' ? 'Seluruh Warga (RW)' : 'Warga RT'}</p>
                  <p className="text-xs text-blue-600 font-medium mt-1">{new Date(act.activity_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                </div>
              </div>
            )) : (
               <p className="text-sm text-slate-500 italic">Belum ada agenda terdekat.</p>
            )}
          </div>
          <button onClick={() => window.location.href = '/dashboard/kegiatan'} className="w-full mt-6 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors mt-auto">
            Lihat Semua Agenda
          </button>
        </div>
      </div>
    </div>
  );
}
