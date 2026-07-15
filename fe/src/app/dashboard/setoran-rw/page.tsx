"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  BanknotesIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentArrowUpIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import withSwal from "sweetalert2-react-content";
import Swal from "sweetalert2";

const MySwal = withSwal(Swal);

export default function SetoranRWPage() {
  const [userData, setUserData] = useState<any>(null);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  
  // Forms
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [proofImage, setProofImage] = useState<File | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUserData(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    if (userData) {
      fetchDeposits();
    }
  }, [userData]);

  const fetchDeposits = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:8000/api/rw-deposits", {
        headers: { 
          "Accept": "application/json",
          Authorization: `Bearer ${token}` 
        }
      });
      const data = await res.json();
      setDeposits(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data setoran.");
    } finally {
      setIsLoading(false);
    }
  };

  const isRT = userData && [3, 6, 7].includes(userData.role_id);
  const isRW = userData && [2, 4, 5].includes(userData.role_id);
  const isSA = userData && userData.role_id === 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofImage) {
      toast.error("Silakan unggah bukti transfer.");
      return;
    }

    setIsSubmitLoading(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("month", month.toString());
    formData.append("year", year.toString());
    formData.append("amount", amount);
    formData.append("proof_image", proofImage);
    if (notes) formData.append("notes", notes);
    
    if (isSA && userData.rt_id) {
        formData.append("rt_id", userData.rt_id.toString());
    }

    try {
      const res = await fetch("http://localhost:8000/api/rw-deposits", {
        method: "POST",
        headers: { 
          "Accept": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: formData
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Setoran berhasil dilaporkan.");
        setAmount("");
        setNotes("");
        setProofImage(null);
        fetchDeposits();
      } else {
        toast.error(data.message || "Gagal melaporkan setoran.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleVerify = async (id: number, status: 'verified' | 'rejected') => {
    const actionText = status === 'verified' ? 'ACC Setoran ini' : 'Tolak Setoran ini';
    
    const { value: rejectNotes, isConfirmed } = await MySwal.fire({
      title: `${actionText}?`,
      text: status === 'verified' ? "Pemasukan kas RW akan otomatis bertambah." : "Masukkan alasan penolakan:",
      input: status === 'rejected' ? 'textarea' : undefined,
      icon: status === 'verified' ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal'
    });

    if (!isConfirmed) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/rw-deposits/${id}/verify`, {
        method: "PUT",
        headers: { 
            "Accept": "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
            status,
            notes: rejectNotes || undefined
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`Setoran berhasil di-${status === 'verified' ? 'ACC' : 'Tolak'}.`);
        fetchDeposits();
      } else {
        toast.error(data.message || "Gagal memperbarui status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircleIcon className="w-4 h-4 mr-1" /> ACC / Selesai</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircleIcon className="w-4 h-4 mr-1" /> Ditolak</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><ClockIcon className="w-4 h-4 mr-1" /> Menunggu</span>;
    }
  };

  if (!userData) return <div className="p-8 text-center">Memuat...</div>;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden bg-slate-50">
      {/* DOCK PANEL (Kiri) - Hanya muncul untuk RT yang bisa submit */}
      {(isRT || (isSA && userData.rt_id)) && (
        <div className="w-full lg:w-[360px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-sm">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
            <h2 className="text-xl font-bold text-slate-800">Lapor Setoran</h2>
            <p className="text-xs text-slate-500 mt-1">Serahkan setoran IPL ke kas RW</p>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Bulan</label>
                  <select 
                    value={month} onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>Bulan {m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tahun</label>
                  <select 
                    value={year} onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {[year - 1, year, year + 1].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nominal Setoran (Rp)</label>
                <input 
                  type="number" min="0" 
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 1500000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Bukti Transfer / Bayar</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <div className="space-y-1 text-center">
                    <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Upload file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setProofImage(e.target.files ? e.target.files[0] : null)} accept="image/*" required />
                        </label>
                        <p className="pl-1">atau drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">
                        {proofImage ? proofImage.name : "PNG, JPG up to 5MB"}
                    </p>
                    </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Catatan Tambahan (Opsional)</label>
                <textarea 
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitLoading ? "Memproses..." : "Kirim Laporan Setoran"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FLOW PANEL (Kanan) - Menampilkan daftar setoran */}
      <div className="flex-1 min-w-0 bg-slate-50 flex flex-col h-full overflow-hidden">
        <div className="p-8 border-b border-slate-200 bg-white shadow-sm z-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
              <BanknotesIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Riwayat Setoran RW</h1>
              <p className="text-sm text-slate-500 mt-1">Daftar setoran IPL yang masuk ke kas RW</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Periode (Bulan/Tahun)</th>
                    <th className="px-6 py-4 font-semibold">Asal (RT)</th>
                    <th className="px-6 py-4 font-semibold">Nominal</th>
                    <th className="px-6 py-4 font-semibold">Bukti</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    {(isRW || isSA) && <th className="px-6 py-4 font-semibold text-right">Aksi Verifikasi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Memuat data...</td></tr>
                  ) : deposits.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Belum ada riwayat setoran.</td></tr>
                  ) : deposits.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {d.month} / {d.year}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {d.rt?.name || "-"}
                      </td>
                      <td className="px-6 py-4 font-bold text-blue-600">
                        {formatRupiah(d.amount)}
                      </td>
                      <td className="px-6 py-4">
                        {d.proof_image_path ? (
                          <a href={`http://localhost:8000/storage/${d.proof_image_path}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs font-medium">
                            Lihat Bukti
                          </a>
                        ) : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(d.status)}
                          {d.notes && <span className="text-[10px] text-slate-500 italic truncate max-w-[150px]" title={d.notes}>Note: {d.notes}</span>}
                        </div>
                      </td>
                      {(isRW || isSA) && (
                        <td className="px-6 py-4 text-right">
                          {d.status === 'pending' ? (
                            <div className="flex justify-end space-x-2">
                              <button onClick={() => handleVerify(d.id, 'verified')} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-bold transition-colors">ACC</button>
                              <button onClick={() => handleVerify(d.id, 'rejected')} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-bold transition-colors">Tolak</button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Selesai oleh: {d.verifier?.name || "-"}</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
