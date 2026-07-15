"use client";

import { useState, useEffect } from "react";
import { PlusIcon, ShoppingBagIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import withSwal from "sweetalert2-react-content";
import Swal from "sweetalert2";

const MySwal = withSwal(Swal);

export default function UmkmPage() {
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Kuliner");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

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
        fetch(`${apiUrl}/api/umkm-businesses`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const userData = await userRes.json();
      setUser(userData.data || userData);

      const recData = await recRes.json();
      setRecords(recData.data || []);
    } catch (error) {
      toast.error("Gagal memuat data UMKM");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const payload = { name, category, phone, address, description };

      const res = await fetch(`${apiUrl}/api/umkm-businesses`, {
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
        toast.error(data.message || "Gagal mendaftarkan usaha");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/umkm-businesses/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success("Status UMKM berhasil diperbarui");
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
            <ShoppingBagIcon className="w-8 h-8 text-orange-500" />
            UMKM Warga
          </h1>
          <p className="text-slate-500 mt-1">Direktori bisnis dan usaha kreatif milik warga.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-sm shadow-orange-200"
        >
          <PlusIcon className="w-5 h-5" />
          Daftarkan Usaha
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-10 text-center text-slate-500">Memuat data UMKM...</div>
        ) : records.length === 0 ? (
          <div className="col-span-full py-10 text-center text-slate-500">Belum ada UMKM yang terdaftar.</div>
        ) : (
          records.map((rec) => (
            <div key={rec.id} className={`bg-white rounded-2xl p-6 border ${rec.status === 'inactive' ? 'border-red-200 bg-red-50/30 opacity-70' : 'border-slate-100'} shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden`}>
              {rec.status === 'inactive' && (
                 <div className="absolute top-4 right-4 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">Nonaktif</div>
              )}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                    <ShoppingBagIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 leading-tight">{rec.name}</h3>
                    <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">{rec.category}</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-slate-600 mb-6">
                  {rec.description && <p className="text-slate-700 italic line-clamp-2">"{rec.description}"</p>}
                  <p><span className="font-medium text-slate-700">Pemilik:</span> {rec.user?.name}</p>
                  <p><span className="font-medium text-slate-700">Alamat:</span> {rec.address || '-'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <a 
                  href={`https://wa.me/${rec.phone?.replace(/^0/, '62')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full block text-center py-2 bg-green-500 text-white hover:bg-green-600 rounded-xl font-medium transition-colors"
                >
                  Hubungi via WhatsApp
                </a>
                
                {(isAdmin || rec.user_id === user?.id) && (
                  <button
                    onClick={() => handleUpdateStatus(rec.id, rec.status === 'active' ? 'inactive' : 'active')}
                    className={`w-full py-2 font-medium rounded-xl transition-colors ${
                      rec.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {rec.status === 'active' ? 'Nonaktifkan Usaha' : 'Aktifkan Kembali'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Daftarkan Usaha UMKM</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Usaha / Toko</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full border-slate-200 rounded-xl focus:ring-orange-500 focus:border-orange-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border-slate-200 rounded-xl focus:ring-orange-500 focus:border-orange-500">
                    <option value="Kuliner">Kuliner / Makanan</option>
                    <option value="Jasa">Jasa / Servis</option>
                    <option value="Fashion">Pakaian / Fashion</option>
                    <option value="Retail">Retail / Warung</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">No. WhatsApp</label>
                  <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812..." className="w-full border-slate-200 rounded-xl focus:ring-orange-500 focus:border-orange-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alamat / Blok Rumah</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border-slate-200 rounded-xl focus:ring-orange-500 focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Misal: Sedia nasi uduk tiap pagi..." className="w-full border-slate-200 rounded-xl focus:ring-orange-500 focus:border-orange-500"></textarea>
              </div>
              
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-xl">Batal</button>
                <button type="submit" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl shadow-sm shadow-orange-200">Daftarkan Sekarang</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
