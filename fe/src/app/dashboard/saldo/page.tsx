"use client";

import { useState, useEffect } from "react";
import { 
  WalletIcon, 
  ArrowPathIcon,
  PlusCircleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  UsersIcon,
  ClockIcon,
  XCircleIcon,
  DocumentIcon
} from "@heroicons/react/24/outline";

export default function SaldoPage() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [allWallets, setAllWallets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals Warga
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupProof, setTopupProof] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const resUser = await fetch(`${apiUrl}/api/user`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const userDataRes = await resUser.json();
      const currentUser = userDataRes.data || userDataRes;
      setUser(currentUser);

      if (currentUser.role_id < 8) {
        // Pengurus: Fetch all wallets
        const res = await fetch(`${apiUrl}/api/wallets/all`, {
          headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
        });
        const data = await res.json();
        if (data.status === 'success') {
          setAllWallets(data.data);
        }
      } else {
        // Warga: Fetch own wallet
        const res = await fetch(`${apiUrl}/api/wallet`, {
          headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
        });
        const data = await res.json();
        if (data.status === 'success') {
          setBalance(data.data.balance);
          setTransactions(data.data.transactions);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setMessage("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const formData = new FormData();
      formData.append('amount', topupAmount);
      formData.append('proof_of_payment', topupProof);

      const res = await fetch(`${apiUrl}/api/wallet/topup`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
        body: formData
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "Top Up berhasil dikirim!");
        setTopupAmount("");
        setTopupProof(null);
        setTimeout(() => {
          setIsTopupModalOpen(false);
          setMessage("");
          fetchData();
        }, 2000);
      } else {
        setMessage(data.message || "Gagal top up");
      }
    } catch (err) {
      setMessage("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  if (isLoading) {
    return <div className="text-center py-10 text-slate-500">Memuat data...</div>;
  }

  // --- TAMPILAN UNTUK PENGURUS (role_id < 8) ---
  if (user && user.role_id < 8) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <UsersIcon className="w-8 h-8 text-blue-600" />
              Manajemen Saldo Warga
            </h1>
            <p className="text-slate-500 mt-1">Pantau saldo kas digital milik warga.</p>
          </div>
          <button onClick={fetchData} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <ArrowPathIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 text-sm font-bold text-slate-600">Nama Warga</th>
                    <th className="py-3 px-4 text-sm font-bold text-slate-600">No. HP</th>
                    <th className="py-3 px-4 text-sm font-bold text-slate-600">RT</th>
                    <th className="py-3 px-4 text-sm font-bold text-slate-600 text-right">Saldo Saat Ini</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allWallets.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 italic">Belum ada data warga.</td>
                    </tr>
                  ) : (
                    allWallets.map(w => (
                      <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-semibold text-slate-800">{w.name}</td>
                        <td className="py-3 px-4 text-sm text-slate-500">{w.phone_number || '-'}</td>
                        <td className="py-3 px-4 text-sm text-slate-500">{w.rt ? w.rt.name : '-'}</td>
                        <td className="py-3 px-4 text-sm font-bold text-blue-700 text-right">{formatCurrency(w.wallet_balance)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- TAMPILAN UNTUK WARGA (role_id >= 8) ---
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <WalletIcon className="w-8 h-8 text-blue-600" />
            Saldo Kas Warga
          </h1>
          <p className="text-slate-500 mt-1">Kelola saldo Anda untuk berdonasi atau pembayaran lainnya.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl transform -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative z-10">
            <p className="text-blue-100 font-medium mb-2">Total Saldo Aktif</p>
            <h2 className="text-4xl font-bold tracking-tight mb-8">
              {formatCurrency(balance)}
            </h2>
            
            <button 
              onClick={() => setIsTopupModalOpen(true)}
              className="w-full py-3 bg-white text-blue-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-sm"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Isi Saldo (Top Up)
            </button>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Riwayat Transaksi</h3>
            <button onClick={fetchData} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {transactions.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <WalletIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Belum ada transaksi</p>
              </div>
            ) : (
              transactions.map((trx: any) => (
                <div key={trx.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      (trx.type === 'deposit' && trx.status === 'approved') || trx.type === 'refund' ? 'bg-emerald-100 text-emerald-600' : 
                      trx.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                      trx.status === 'rejected' ? 'bg-slate-100 text-slate-500' :
                      'bg-rose-100 text-rose-600'
                    }`}>
                      {trx.status === 'pending' ? <ClockIcon className="w-5 h-5" /> : 
                       trx.status === 'rejected' ? <XCircleIcon className="w-5 h-5" /> :
                       (trx.type === 'deposit' || trx.type === 'refund' ? <ArrowDownIcon className="w-5 h-5" /> : <ArrowUpIcon className="w-5 h-5" />)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 capitalize">
                        {trx.type === 'deposit' ? 'Top Up' : trx.type === 'donation' ? 'Donasi' : trx.type === 'refund' ? 'Refund Sisa Donasi' : trx.type}
                        {trx.status === 'pending' && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Menunggu</span>}
                        {trx.status === 'rejected' && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded">Ditolak</span>}
                      </p>
                      <p className="text-xs text-slate-500">{trx.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${trx.status === 'rejected' ? 'text-slate-400 line-through' : (trx.type === 'deposit' || trx.type === 'refund' ? 'text-emerald-600' : 'text-slate-800')}`}>
                      {trx.type === 'deposit' || trx.type === 'refund' ? '+' : '-'}{formatCurrency(trx.amount)}
                    </p>
                    <p className="text-xs text-slate-400">{new Date(trx.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isTopupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-blue-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Top Up Saldo Warga</h2>
              <button onClick={() => setIsTopupModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleTopup} className="p-6">
              
              <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <p className="text-sm text-slate-600 mb-3">Silakan Scan QR Kas RW berikut untuk Top Up Saldo Anda, lalu unggah bukti transfer.</p>
                <div className="w-32 h-32 bg-white border border-dashed border-slate-300 mx-auto rounded-xl flex items-center justify-center shadow-sm">
                  <div className="text-center">
                    <div className="grid grid-cols-2 gap-1 w-12 h-12 mx-auto mb-1">
                      <div className="bg-blue-600 w-full h-full rounded-sm"></div>
                      <div className="bg-blue-600 w-full h-full rounded-sm"></div>
                      <div className="bg-blue-600 w-full h-full rounded-sm"></div>
                      <div className="border-2 border-blue-600 w-full h-full rounded-sm"></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">QRIS RW</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nominal Transfer (Rp)</label>
                  <input
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-bold"
                    placeholder="Contoh: 50000"
                    min="1000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Upload Bukti Transfer (Opsional)</label>
                  <div className="border border-slate-200 bg-slate-50 rounded-xl p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => setTopupProof(e.target.files ? e.target.files[0] : null)} 
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" 
                    />
                  </div>
                </div>

                {message && (
                  <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${message.includes('berhasil') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {message.includes('berhasil') ? <CheckCircleIcon className="w-5 h-5 shrink-0" /> : <XCircleIcon className="w-5 h-5 shrink-0" />}
                    <span>{message}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsTopupModalOpen(false)}
                  className="flex-1 py-3 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !topupAmount}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Mengirim...' : 'Top Up Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
