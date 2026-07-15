"use client";

import { useState, useEffect, useCallback } from "react";
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import withSwal from "sweetalert2-react-content";
import Swal from "sweetalert2";

const MySwal = withSwal(Swal);

export default function MasterPerkawinanPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [name, setName] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiUrl}/api/marital-statuses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setItems(data.data || []);
      else toast.error("Gagal mengambil data.");
    } catch { toast.error("Terjadi kesalahan jaringan."); }
    finally { setIsLoading(false); }
  }, [apiUrl]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (item: any = null) => {
    setEditData(item);
    setName(item?.name || "");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const url = editData ? `${apiUrl}/api/marital-statuses/${editData.id}` : `${apiUrl}/api/marital-statuses`;
    const method = editData ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) { toast.success(data.message || "Berhasil!"); setShowModal(false); fetchData(); }
      else toast.error(data.message || "Gagal menyimpan.");
    } catch { toast.error("Terjadi kesalahan."); }
  };

  const handleDelete = async (id: number) => {
    const result = await MySwal.fire({
      title: "Hapus Status Perkawinan?",
      text: "Data yang sedang digunakan oleh warga tidak bisa dihapus.",
      icon: "warning", showCancelButton: true,
      confirmButtonText: "Ya, Hapus!", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiUrl}/api/marital-statuses/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) { toast.success(data.message!); fetchData(); }
      else toast.error(data.message || "Gagal menghapus.");
    } catch { toast.error("Terjadi kesalahan."); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Master Status Perkawinan</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola daftar status perkawinan yang tersedia di profil warga.</p>
        </div>
        <button onClick={() => openModal()} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
          <PlusIcon className="w-5 h-5" /><span>Tambah Status</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Memuat data...</div>
        ) : items.length === 0 ? (
          <div className="p-16 flex flex-col items-center text-slate-400">
            <p>Belum ada status perkawinan.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 w-16">No</th>
                <th className="px-6 py-4">Status Perkawinan</th>
                <th className="px-6 py-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, i) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">{i + 1}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openModal(item)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><PencilSquareIcon className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{editData ? "Edit Status Perkawinan" : "Tambah Status Perkawinan"}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nama Status</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                  placeholder="Contoh: Belum Kawin, Kawin, Cerai Hidup" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="w-full py-3 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
                <button type="submit" className="w-full py-3 text-white font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
