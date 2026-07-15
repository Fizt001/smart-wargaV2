"use client";

import { useState, useEffect } from "react";
import { PlusIcon, MegaphoneIcon, CheckCircleIcon, XCircleIcon, ClockIcon, WrenchIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import withSwal from "sweetalert2-react-content";
import Swal from "sweetalert2";

const MySwal = withSwal(Swal);

export default function PengaduanPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    category: "",
    title: "",
    description: "",
  });

  const [responseFormData, setResponseFormData] = useState({
    status: "",
    response: ""
  });

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const userRes = await fetch("http://localhost:8000/api/user", { headers: { Authorization: `Bearer ${token}` } });
      if (userRes.ok) setUser(await userRes.json());

      const complaintsRes = await fetch("http://localhost:8000/api/complaints", { headers: { Authorization: `Bearer ${token}` } });
      if (complaintsRes.ok) {
        const data = await complaintsRes.json();
        setComplaints(data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch("http://localhost:8000/api/complaints", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Pengaduan berhasil diajukan!");
        setShowModal(false);
        setFormData({ category: "", title: "", description: "" });
        fetchData();
      } else {
        toast.error(data.message || "Gagal mengajukan pengaduan.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`http://localhost:8000/api/complaints/${selectedComplaint.id}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(responseFormData)
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Status pengaduan diperbarui!");
        setShowResponseModal(false);
        setSelectedComplaint(null);
        fetchData();
      } else {
        toast.error(data.message || "Gagal memperbarui status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const isPengurus = user && user.role_id <= 7;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit"><ClockIcon className="w-3 h-3 mr-1" /> Menunggu</span>;
      case 'processing': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit"><WrenchIcon className="w-3 h-3 mr-1" /> Diproses</span>;
      case 'resolved': return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit"><CheckCircleIcon className="w-3 h-3 mr-1" /> Selesai</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit"><XCircleIcon className="w-3 h-3 mr-1" /> Ditolak</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Layanan Pengaduan Warga</h1>
            <p className="text-slate-500 text-sm mt-1">
              {isPengurus ? "Kelola komplain dan laporan dari warga." : "Sampaikan keluhan dan laporan infrastruktur lingkungan."}
            </p>
          </div>
          {!isPengurus && (
            <button 
              onClick={() => setShowModal(true)}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Buat Pengaduan</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Memuat data...</div>
          ) : complaints.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-500">
              <MegaphoneIcon className="w-16 h-16 text-slate-200 mb-4" />
              <p>{isPengurus ? "Belum ada pengaduan dari warga." : "Anda belum pernah membuat pengaduan."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all flex flex-col h-full bg-slate-50/50">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md">{complaint.category}</span>
                    {getStatusBadge(complaint.status)}
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">{complaint.title}</h3>
                  <p className="text-sm text-slate-600 mb-4 flex-grow line-clamp-3">{complaint.description}</p>
                  
                  <div className="border-t border-slate-200 pt-3 mt-auto">
                    {isPengurus && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-500 font-medium">Pelapor: <span className="font-bold text-slate-700">{complaint.user?.name} (RT {complaint.user?.rt_id})</span></span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">{new Date(complaint.created_at).toLocaleDateString('id-ID')}</span>
                      
                      {isPengurus && (
                        <button 
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setResponseFormData({ status: complaint.status, response: complaint.response || "" });
                            setShowResponseModal(true);
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
                        >
                          Tindak Lanjut
                        </button>
                      )}
                    </div>
                    {complaint.response && !isPengurus && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <p className="text-xs font-bold text-blue-800 mb-1">Tanggapan Pengurus:</p>
                        <p className="text-xs text-slate-700">{complaint.response}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL BUAT PENGADUAN */}
      {showModal && !isPengurus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Ajukan Pengaduan</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Kategori</label>
                <select 
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>-- Pilih Kategori --</option>
                  <option value="Fasilitas Umum">Fasilitas Umum (Jalan, Selokan)</option>
                  <option value="Keamanan">Keamanan & Ketertiban</option>
                  <option value="Kebersihan">Kebersihan Lingkungan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Judul Laporan</label>
                <input 
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Lampu PJU RT 01 Mati"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi Detail</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jelaskan detail lokasi dan kondisinya..."
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold transition-colors">Batal</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors">Kirim Laporan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RESPON PENGURUS */}
      {showResponseModal && selectedComplaint && isPengurus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Tindak Lanjut Pengaduan</h3>
              <button onClick={() => setShowResponseModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              
              <div className="p-3 bg-slate-100 rounded-lg text-sm mb-4">
                <p className="font-bold text-slate-800">{selectedComplaint.title}</p>
                <p className="text-slate-600 mt-1">{selectedComplaint.description}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Ubah Status</label>
                <select 
                  required
                  value={responseFormData.status}
                  onChange={(e) => setResponseFormData({...responseFormData, status: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Menunggu</option>
                  <option value="processing">Diproses</option>
                  <option value="resolved">Selesai (Resolved)</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tanggapan (Opsional)</label>
                <textarea 
                  rows={3}
                  value={responseFormData.response}
                  onChange={(e) => setResponseFormData({...responseFormData, response: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tulis tanggapan untuk warga..."
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowResponseModal(false)} className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold transition-colors">Batal</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors">Simpan Tanggapan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
