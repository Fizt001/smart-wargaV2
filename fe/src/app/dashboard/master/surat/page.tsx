"use client";

import { useState, useEffect } from "react";
import { PlusIcon, PencilSquareIcon, TrashIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import withSwal from "sweetalert2-react-content";
import Swal from "sweetalert2";

const MySwal = withSwal(Swal);

export default function MasterSuratPage() {
  const [types, setTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    requires_rw_approval: false
  });

  const fetchTypes = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:8000/api/letter-types", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTypes(data.data || []);
      } else {
        toast.error("Gagal mengambil data master surat.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleOpenModal = (data: any = null) => {
    setEditData(data);
    if (data) {
      setFormData({
        name: data.name,
        requires_rw_approval: data.requires_rw_approval
      });
    } else {
      setFormData({ name: "", requires_rw_approval: false });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    try {
      const url = editData 
        ? `http://localhost:8000/api/letter-types/${editData.id}` 
        : `http://localhost:8000/api/letter-types`;
      const method = editData ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Berhasil disimpan!");
        setShowModal(false);
        fetchTypes();
      } else {
        toast.error(data.message || "Gagal menyimpan data.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleDelete = async (id: number) => {
    const result = await MySwal.fire({
      title: 'Hapus Tipe Surat?',
      text: "Jika tipe surat ini sudah digunakan, maka tidak bisa dihapus.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });
    
    if (!result.isConfirmed) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/letter-types/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Berhasil dihapus!");
        fetchTypes();
      } else {
        toast.error(data.message || "Gagal menghapus.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Master Tipe Surat</h1>
            <p className="text-slate-500 text-sm mt-1">Kelola jenis-jenis surat yang dapat diajukan oleh Warga.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Tambah Tipe Surat</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Memuat data...</div>
          ) : types.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-500">
              <DocumentTextIcon className="w-16 h-16 text-slate-200 mb-4" />
              <p>Belum ada tipe surat yang ditambahkan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">No</th>
                    <th className="px-6 py-4">Nama / Jenis Surat</th>
                    <th className="px-6 py-4 text-center">Butuh Validasi RW?</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {types.map((type, index) => (
                    <tr key={type.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">{index + 1}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{type.name}</td>
                      <td className="px-6 py-4 text-center">
                        {type.requires_rw_approval ? (
                          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">Ya</span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">Tidak (Cukup RT)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button onClick={() => handleOpenModal(type)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(type.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{editData ? 'Edit Tipe Surat' : 'Tambah Tipe Surat'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nama Jenis Surat</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                  placeholder="Contoh: Surat Pengantar Domisili"
                />
              </div>
              
              <div className="flex items-center space-x-3 pt-2">
                <input 
                  type="checkbox" 
                  id="req_rw"
                  checked={formData.requires_rw_approval}
                  onChange={(e) => setFormData({...formData, requires_rw_approval: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="req_rw" className="text-sm font-medium text-slate-700">Surat ini butuh tanda tangan/validasi dari tingkat RW</label>
              </div>

              <div className="flex space-x-3 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold transition-colors">Batal</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-sm">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
