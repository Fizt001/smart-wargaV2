"use client";

import { useState, useEffect } from "react";
import { PlusIcon, BriefcaseIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import withSwal from "sweetalert2-react-content";
import Swal from "sweetalert2";

const MySwal = withSwal(Swal);

export default function KoperasiPage() {
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState("saving");
  const [amount, setAmount] = useState("");
  const [termMonths, setTermMonths] = useState("1");
  const [notes, setNotes] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [userRes, recRes] = await Promise.all([
        fetch(`${apiUrl}/api/user`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/cooperative-transactions`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const userData = await userRes.json();
      setUser(userData.data || userData);

      const recData = await recRes.json();
      setRecords(recData.data || []);
    } catch (error) {
      toast.error("Gagal memuat data koperasi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const payload = { type, amount, term_months: type === 'loan' ? termMonths : null, notes };

      const res = await fetch(`${apiUrl}/api/cooperative-transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.status === "success") {
        toast.success(data.message);
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error(data.message || "Gagal mengajukan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const handleUpdateStatus = async (id: number, status: string, isLoan: boolean) => {
    let confirmText = isLoan ? 
        (status === 'approved' ? "Cairkan pinjaman? Kas Koperasi akan dipotong." : "Lunasi pinjaman ini beserta bunga?") : 
        "Setujui simpanan ini?";
        
    MySwal.fire({
      title: "Konfirmasi",
      text: confirmText,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Lanjutkan",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${apiUrl}/api/cooperative-transactions/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status })
          });
          const data = await res.json();
          if (data.status === "success") {
            toast.success("Transaksi berhasil diproses");
            fetchData();
          } else {
            toast.error("Gagal memproses");
          }
        } catch (error) {
          toast.error("Kesalahan sistem");
        }
      }
    });
  };

  const isAdmin = user && user.role_id < 8;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BriefcaseIcon className="w-8 h-8 text-indigo-500" />
            Koperasi Simpan Pinjam
          </h1>
          <p className="text-slate-500 mt-1">Layanan keuangan mikro untuk kemandirian warga RW.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-sm shadow-indigo-200"
        >
          <PlusIcon className="w-5 h-5" />
          Pengajuan Baru
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full py-10 text-center text-slate-500">Memuat data...</div>
        ) : records.length === 0 ? (
          <div className="col-span-full py-10 text-center text-slate-500">Belum ada transaksi koperasi.</div>
        ) : (
          records.map((rec) => {
            const isLoan = rec.type === 'loan';
            const totalRepayment = isLoan ? Number(rec.amount) + (Number(rec.amount) * (Number(rec.interest_rate) / 100) * Number(rec.term_months || 1)) : 0;
            
            return (
              <div key={rec.id} className={`bg-white rounded-2xl p-6 border ${isLoan ? 'border-amber-100' : 'border-indigo-100'} shadow-sm flex flex-col justify-between`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full ${isLoan ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {isLoan ? 'PINJAMAN' : 'SIMPANAN'}
                    </span>
                    <h3 className="font-bold text-lg text-slate-800 mt-2">{rec.user?.name}</h3>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
                    rec.status === 'approved' ? 'bg-blue-100 text-blue-700' : 
                    rec.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                    rec.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {rec.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-slate-600 mb-6">
                  <p><span className="font-medium text-slate-700">Tanggal:</span> {new Date(rec.created_at).toLocaleDateString('id-ID')}</p>
                  <p><span className="font-medium text-slate-700">Nominal Pengajuan:</span> Rp {Number(rec.amount).toLocaleString('id-ID')}</p>
                  {isLoan && (
                    <>
                      <p><span className="font-medium text-slate-700">Tenor:</span> {rec.term_months} Bulan</p>
                      <p><span className="font-medium text-slate-700">Bunga:</span> {rec.interest_rate}% per bulan</p>
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="font-medium text-slate-700">Total Pengembalian:</p>
                        <p className="text-lg font-bold text-slate-800">Rp {totalRepayment.toLocaleString('id-ID')}</p>
                      </div>
                    </>
                  )}
                  {rec.notes && <p className="italic text-slate-500 mt-2">"{rec.notes}"</p>}
                </div>
                
                {isAdmin && (
                  <div className="flex gap-2">
                    {rec.status === 'pending' && (
                      <>
                        <button onClick={() => handleUpdateStatus(rec.id, 'approved', isLoan)} className="flex-1 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium transition-colors">Setujui</button>
                        <button onClick={() => handleUpdateStatus(rec.id, 'rejected', isLoan)} className="flex-1 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors">Tolak</button>
                      </>
                    )}
                    {rec.status === 'approved' && isLoan && (
                      <button onClick={() => handleUpdateStatus(rec.id, 'paid', true)} className="w-full py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl font-medium transition-colors">Lunasi Pinjaman</button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Form Pengajuan Koperasi</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="flex gap-4 p-1 bg-slate-100 rounded-xl mb-4">
                <button type="button" onClick={() => setType('saving')} className={`flex-1 py-2 rounded-lg font-medium transition-colors ${type === 'saving' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>Simpanan</button>
                <button type="button" onClick={() => setType('loan')} className={`flex-1 py-2 rounded-lg font-medium transition-colors ${type === 'loan' ? 'bg-white shadow text-amber-700' : 'text-slate-500 hover:text-slate-700'}`}>Pinjaman</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
                <input type="number" required min="1000" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              
              {type === 'loan' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tenor (Bulan)</label>
                  <input type="number" required min="1" max="24" value={termMonths} onChange={(e) => setTermMonths(e.target.value)} className="w-full border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500" />
                  <p className="text-xs text-amber-600 mt-1">*Bunga standar koperasi 2% per bulan</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan / Tujuan</label>
                <textarea rows={2} required value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={type === 'loan' ? "Misal: Modal usaha UMKM..." : "Misal: Simpanan wajib bulan ini..."} className="w-full border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"></textarea>
              </div>
              
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-xl">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm shadow-indigo-200">Kirim Pengajuan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
