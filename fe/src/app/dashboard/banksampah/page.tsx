"use client";

import { useState, useEffect } from "react";
import { PlusIcon, TrashIcon, CheckCircleIcon, BanknotesIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

export default function BankSampahPage() {
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wasteType, setWasteType] = useState("Kardus");
  const [weightKg, setWeightKg] = useState("");
  const [pricePerKg, setPricePerKg] = useState("2000"); // default harga
  const [paymentMethod, setPaymentMethod] = useState("wallet");

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
        fetch(`${apiUrl}/api/waste-deposits`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const userData = await userRes.json();
      setUser(userData.data || userData);

      const recData = await recRes.json();
      setRecords(recData.data || []);
    } catch (error) {
      toast.error("Gagal memuat data bank sampah");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const payload = {
        waste_type: wasteType,
        weight_kg: weightKg,
        price_per_kg: pricePerKg,
        payment_method: paymentMethod
      };

      const res = await fetch(`${apiUrl}/api/waste-deposits`, {
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
        toast.error(data.message || "Gagal menyetor sampah");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/waste-deposits/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success(data.message);
        fetchData();
      } else {
        toast.error("Gagal mengubah status");
      }
    } catch (error) {
      toast.error("Kesalahan sistem");
    }
  };

  const isAdmin = user && user.role_id < 8;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrashIcon className="w-8 h-8 text-green-500" />
            Bank Sampah RW
          </h1>
          <p className="text-slate-500 mt-1">Setor sampah daur ulang dan dapatkan reward Rupiah.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-sm shadow-green-200"
        >
          <PlusIcon className="w-5 h-5" />
          Setor Sampah
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-10 text-center text-slate-500">Memuat data...</div>
        ) : records.length === 0 ? (
          <div className="col-span-full py-10 text-center text-slate-500">Belum ada riwayat setoran.</div>
        ) : (
          records.map((rec) => (
            <div key={rec.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    {rec.waste_type}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    rec.status === 'approved' ? 'bg-green-100 text-green-700' : 
                    rec.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {rec.status === 'approved' ? 'Selesai' : rec.status === 'rejected' ? 'Ditolak' : 'Menunggu Pengecekan'}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <p><span className="font-medium text-slate-700">Tgl Setor:</span> {rec.date}</p>
                  <p><span className="font-medium text-slate-700">Penyetor:</span> {rec.user?.name}</p>
                  <p><span className="font-medium text-slate-700">Berat:</span> {rec.weight_kg} kg (@Rp {Number(rec.price_per_kg).toLocaleString('id-ID')}/kg)</p>
                  <p><span className="font-medium text-slate-700">Pembayaran:</span> {rec.payment_method === 'wallet' ? 'Transfer Saldo' : 'Uang Tunai'}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex items-center justify-between mb-4">
                  <span className="font-semibold text-green-800">Total Rupiah</span>
                  <span className="font-bold text-green-700">Rp {Number(rec.total_amount).toLocaleString('id-ID')}</span>
                </div>
              </div>
              
              {isAdmin && rec.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(rec.id, 'approved')}
                    className="flex-1 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    Terima Setoran
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Setor Sampah Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Sampah</label>
                <select value={wasteType} onChange={(e) => setWasteType(e.target.value)} className="w-full border-slate-200 rounded-xl focus:ring-green-500 focus:border-green-500">
                  <option value="Kardus & Kertas">Kardus & Kertas</option>
                  <option value="Plastik Botol">Plastik Botol</option>
                  <option value="Besi & Logam">Besi & Logam</option>
                  <option value="Minyak Jelantah">Minyak Jelantah</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Berat (kg / liter)</label>
                  <input type="number" step="0.1" required value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="w-full border-slate-200 rounded-xl focus:ring-green-500 focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estimasi Harga/kg</label>
                  <input type="number" required value={pricePerKg} onChange={(e) => setPricePerKg(e.target.value)} className="w-full border-slate-200 rounded-xl focus:ring-green-500 focus:border-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Metode Pembayaran Reward</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border-slate-200 rounded-xl focus:ring-green-500 focus:border-green-500">
                  <option value="wallet">Tambah ke Saldo Warga (Otomatis)</option>
                  <option value="cash">Uang Tunai dari Pengurus</option>
                </select>
              </div>
              
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-xl">Batal</button>
                <button type="submit" className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl">Kirim Setoran</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
