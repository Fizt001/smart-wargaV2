"use client";

import { useState, useEffect } from "react";
import { PlusIcon, UserGroupIcon, HomeModernIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import withSwal from "sweetalert2-react-content";
import Swal from "sweetalert2";

const MySwal = withSwal(Swal);

export default function RukunKematianPage() {
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deceasedName, setDeceasedName] = useState("");
  const [nik, setNik] = useState("");
  const [dateOfDeath, setDateOfDeath] = useState("");
  const [cause, setCause] = useState("");
  const [burialLocation, setBurialLocation] = useState("");
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
        fetch(`${apiUrl}/api/death-records`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const userData = await userRes.json();
      setUser(userData.data || userData);

      const recData = await recRes.json();
      setRecords(recData.data || []);

    } catch (error) {
      toast.error("Gagal memuat data rukun kematian");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const payload = {
        deceased_name: deceasedName,
        nik,
        date_of_death: dateOfDeath,
        cause_of_death: cause,
        burial_location: burialLocation,
        notes
      };

      const res = await fetch(`${apiUrl}/api/death-records`, {
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
        toast.error(data.message || "Gagal melaporkan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    MySwal.fire({
      title: "Cairkan Santunan Duka?",
      text: "Santunan duka akan dipotong otomatis dari Kas RW.",
      input: "number",
      inputLabel: "Nominal Santunan (Rp)",
      inputValue: "1000000",
      showCancelButton: true,
      confirmButtonText: "Proses Pencairan",
      confirmButtonColor: "#14b8a6",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${apiUrl}/api/death-records/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status, compensation_amount: result.value })
          });
          const data = await res.json();
          if (data.status === "success") {
            toast.success("Santunan berhasil dicairkan!");
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
            <HomeModernIcon className="w-8 h-8 text-teal-600" />
            Rukun Kematian
          </h1>
          <p className="text-slate-500 mt-1">Laporan kedukaan warga & pencairan dana santunan RW.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-sm shadow-teal-200"
        >
          <PlusIcon className="w-5 h-5" />
          Lapor Kedukaan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-10 text-center text-slate-500">Memuat data...</div>
        ) : records.length === 0 ? (
          <div className="col-span-full py-10 text-center text-slate-500">Belum ada catatan kedukaan.</div>
        ) : (
          records.map((rec) => (
            <div key={rec.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-slate-800">{rec.deceased_name}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    rec.status === 'disbursed' ? 'bg-teal-100 text-teal-700' : 
                    rec.status === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {rec.status === 'disbursed' ? 'Santunan Cair' : rec.status === 'approved' ? 'Disetujui' : 'Menunggu'}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <p><span className="font-medium text-slate-700">Tanggal Wafat:</span> {rec.date_of_death}</p>
                  {rec.burial_location && <p><span className="font-medium text-slate-700">Lokasi Makam:</span> {rec.burial_location}</p>}
                  {rec.cause_of_death && <p><span className="font-medium text-slate-700">Penyebab:</span> {rec.cause_of_death}</p>}
                  {rec.compensation_amount > 0 && <p><span className="font-medium text-slate-700">Santunan:</span> Rp {Number(rec.compensation_amount).toLocaleString('id-ID')}</p>}
                </div>
              </div>
              
              {isAdmin && rec.status === 'pending' && (
                <button
                  onClick={() => handleUpdateStatus(rec.id, 'disbursed')}
                  className="w-full py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Cairkan Santunan
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Lapor Kedukaan Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Almarhum/ah</label>
                <input required value={deceasedName} onChange={(e) => setDeceasedName(e.target.value)} className="w-full border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NIK (Opsional)</label>
                  <input value={nik} onChange={(e) => setNik(e.target.value)} className="w-full border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Wafat</label>
                  <input type="date" required value={dateOfDeath} onChange={(e) => setDateOfDeath(e.target.value)} className="w-full border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi Pemakaman</label>
                <input value={burialLocation} onChange={(e) => setBurialLocation(e.target.value)} className="w-full border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Penyebab Wafat (Opsional)</label>
                <input value={cause} onChange={(e) => setCause(e.target.value)} className="w-full border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500" />
              </div>
              
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-xl">Batal</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl">Kirim Laporan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
