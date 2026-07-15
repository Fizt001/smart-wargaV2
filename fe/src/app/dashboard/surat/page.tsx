"use client";

import { useState, useEffect } from "react";
import { PlusIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import withSwal from "sweetalert2-react-content";
import Swal from "sweetalert2";

const MySwal = withSwal(Swal);

export default function SuratPage() {
  const [letters, setLetters] = useState<any[]>([]);
  const [letterTypes, setLetterTypes] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    letter_type_id: "",
    notes: ""
  });

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const [userRes, lettersRes, typesRes] = await Promise.all([
        fetch("http://localhost:8000/api/user", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8000/api/letters", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8000/api/letter-types", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (userRes.ok) setUser(await userRes.json());

      if (lettersRes.ok) {
        const lettersData = await lettersRes.json();
        setLetters(lettersData.data || []);
      }
      
      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setLetterTypes(typesData.data || []);
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
      const res = await fetch("http://localhost:8000/api/letters", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Permohonan surat berhasil diajukan!");
        setShowModal(false);
        setFormData({ letter_type_id: "", notes: "" });
        fetchData();
      } else {
        toast.error(data.message || "Gagal mengajukan surat.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    const actionText = status === 'approved' ? 'Setujui' : 'Tolak';
    const confirmColor = status === 'approved' ? '#10b981' : '#ef4444';

    const result = await MySwal.fire({
      title: `${actionText} Surat?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      cancelButtonText: 'Batal',
      confirmButtonText: `Ya, ${actionText}`
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/letters/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Surat berhasil di${actionText.toLowerCase()}.`);
        fetchData();
      } else {
        toast.error(data.message || "Gagal mengubah status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const isPengurus = user && user.role_id <= 7;
  const isRWPengurus = user && [1, 2, 4].includes(user.role_id); // Superadmin, Ketua RW, Sekretaris RW
  const isRTPengurus = user && [3, 6].includes(user.role_id); // Ketua RT, Sekretaris RT

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit"><ClockIcon className="w-3 h-3 mr-1" /> Menunggu Pengurus RT</span>;
      case 'approved_rt': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit"><ClockIcon className="w-3 h-3 mr-1" /> Menunggu Pengurus RW</span>;
      case 'approved': return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit"><CheckCircleIcon className="w-3 h-3 mr-1" /> Disetujui RT/RW</span>;
      case 'completed': return <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit"><CheckCircleIcon className="w-3 h-3 mr-1" /> Selesai / Terbit</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit"><XCircleIcon className="w-3 h-3 mr-1" /> Ditolak</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Administrasi Surat Menyurat</h1>
            <p className="text-slate-500 text-sm mt-1">
              {isPengurus ? "Daftar permohonan surat dari warga." : "Ajukan dan pantau status permohonan surat Anda."}
            </p>
          </div>
          {!isPengurus && (
            <button 
              onClick={() => setShowModal(true)}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Ajukan Surat Baru</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Memuat data...</div>
          ) : letters.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-500">
              <DocumentTextIcon className="w-16 h-16 text-slate-200 mb-4" />
              <p>{isPengurus ? "Belum ada permohonan surat masuk." : "Anda belum pernah mengajukan surat."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Nomor Surat</th>
                    {isPengurus && <th className="px-6 py-4">Nama Pemohon</th>}
                    <th className="px-6 py-4">Jenis Surat</th>
                    <th className="px-6 py-4">Keterangan</th>
                    <th className="px-6 py-4">Tanggal Pengajuan</th>
                    <th className="px-6 py-4">Status</th>
                    {isPengurus && <th className="px-6 py-4 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {letters.map((letter) => (
                    <tr key={letter.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{letter.letter_number}</td>
                      {isPengurus && (
                        <td className="px-6 py-4">
                           <p className="font-bold text-slate-800">{letter.user?.name}</p>
                           <p className="text-xs text-slate-500">RT {letter.user?.rt_id}</p>
                        </td>
                      )}
                      <td className="px-6 py-4 font-medium text-slate-700">{letter.letter_type?.name}</td>
                      <td className="px-6 py-4 max-w-xs truncate" title={letter.notes}>{letter.notes}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(letter.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4">{getStatusBadge(letter.status)}</td>
                      {isPengurus && (
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            {/* RT/Sekretaris RT dapat memproses surat pending */}
                            {isRTPengurus && letter.status === 'pending' && (
                               <>
                                 <button onClick={() => handleUpdateStatus(letter.id, 'approved')} className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg shadow-sm">Setujui</button>
                                 <button onClick={() => handleUpdateStatus(letter.id, 'rejected')} className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg shadow-sm">Tolak</button>
                               </>
                            )}
                            {/* RW/Sekretaris RW dapat memproses surat yang approved_rt (butuh RW) atau langsung jika mereka mau */}
                            {isRWPengurus && letter.status === 'approved_rt' && (
                               <>
                                 <button onClick={() => handleUpdateStatus(letter.id, 'approved')} className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg shadow-sm">Setujui</button>
                                 <button onClick={() => handleUpdateStatus(letter.id, 'rejected')} className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg shadow-sm">Tolak</button>
                               </>
                            )}
                            {/* Sekretaris mencetak dan menandai selesai */}
                            {user && [1, 4, 6].includes(user.role_id) && letter.status === 'approved' && (
                               <>
                                 <button onClick={() => handleUpdateStatus(letter.id, 'completed')} className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 px-3 py-1.5 rounded-lg inline-block">Tandai Selesai</button>
                                 <a href={`/dashboard/surat/${letter.id}/print`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg inline-block">Cetak / PDF</a>
                               </>
                            )}
                            {user && [1, 4, 6].includes(user.role_id) && letter.status === 'completed' && (
                               <a href={`/dashboard/surat/${letter.id}/print`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg inline-block">Cetak Ulang</a>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && !isPengurus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Ajukan Surat Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Jenis Surat</label>
                <select 
                  required
                  value={formData.letter_type_id}
                  onChange={(e) => setFormData({...formData, letter_type_id: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                >
                  <option value="" disabled>-- Pilih Tipe --</option>
                  {letterTypes.map(type => (
                     <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Keterangan / Keperluan</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                  placeholder="Ceritakan keperluan permohonan surat ini secara singkat..."
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold transition-colors">Batal</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-sm">Ajukan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
