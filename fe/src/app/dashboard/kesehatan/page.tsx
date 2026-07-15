"use client";

import { useState, useEffect } from "react";
import { PlusIcon, UserGroupIcon, ScaleIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import withSwal from "sweetalert2-react-content";
import Swal from "sweetalert2";

const MySwal = withSwal(Swal);

export default function KesehatanPage() {
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [recordDate, setRecordDate] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [headCirc, setHeadCirc] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [notes, setNotes] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const fetchList = [
        fetch(`${apiUrl}/api/user`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/health-records`, { headers: { Authorization: `Bearer ${token}` } })
      ];

      const [userRes, recRes] = await Promise.all(fetchList);
      
      const userData = await userRes.json();
      const currentUser = userData.data || userData;
      setUser(currentUser);

      const recData = await recRes.json();
      setRecords(recData.data || []);

      if (currentUser.role_id < 8) {
        const famRes = await fetch(`${apiUrl}/api/family-members`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const famData = await famRes.json();
        setFamilyMembers(famData.data || []);
      }
    } catch (error) {
      toast.error("Gagal memuat data kesehatan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const payload = {
        family_member_id: memberId,
        record_date: recordDate,
        weight,
        height,
        head_circumference: headCirc || null,
        blood_pressure: bloodPressure || null,
        notes: notes || null
      };

      const res = await fetch(`${apiUrl}/api/health-records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.status === "success") {
        toast.success(data.message);
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error(data.message || "Gagal menyimpan data");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const isAdmin = user && user.role_id < 8;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ScaleIcon className="w-8 h-8 text-rose-500" />
            Posyandu & Kesehatan
          </h1>
          <p className="text-slate-500 mt-1">Catatan pertumbuhan balita dan riwayat kesehatan lansia.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium shadow-sm shadow-rose-200"
          >
            <PlusIcon className="w-5 h-5" />
            Tambah Catatan
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Mobile View (Cards) */}
        <div className="md:hidden divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Memuat data...</div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">Belum ada riwayat kesehatan.</div>
          ) : (
            records.map((rec) => {
              const birthDate = new Date(rec.family_member?.birth_date);
              const ageInYears = new Date().getFullYear() - birthDate.getFullYear();
              
              return (
                <div key={rec.id} className="p-5 space-y-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="font-bold text-slate-800 leading-tight">{rec.family_member?.name}</div>
                      <div className="text-sm text-slate-500 mt-1">{ageInYears} tahun</div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg shrink-0">
                      {rec.record_date}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 rounded-xl p-4 border border-slate-100/60">
                    <div>
                      <span className="block text-xs text-slate-500 font-medium mb-1">Berat Badan</span>
                      <span className="font-bold text-slate-700 text-lg">{rec.weight} <span className="text-xs font-medium text-slate-400">kg</span></span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500 font-medium mb-1">Tinggi Badan</span>
                      <span className="font-bold text-slate-700 text-lg">{rec.height} <span className="text-xs font-medium text-slate-400">cm</span></span>
                    </div>
                  </div>

                  {(rec.head_circumference || rec.blood_pressure || rec.notes) && (
                    <div className="text-xs text-slate-600 bg-blue-50/50 rounded-xl p-3 border border-blue-100/50 space-y-1.5">
                      {rec.head_circumference && <div className="flex justify-between"><span className="text-slate-500 font-medium">Lingkar Kepala</span> <span className="font-bold text-slate-700">{rec.head_circumference} cm</span></div>}
                      {rec.blood_pressure && <div className="flex justify-between"><span className="text-slate-500 font-medium">Tensi</span> <span className="font-bold text-slate-700">{rec.blood_pressure}</span></div>}
                      {rec.notes && <div className="mt-2 text-slate-500 italic pt-2 border-t border-blue-100/50">"{rec.notes}"</div>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto p-0">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Tanggal</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Nama Warga</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Umur</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-sm">BB (kg)</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-sm">TB (cm)</th>
                <th className="py-4 px-6 font-semibold text-slate-600 text-sm">Tambahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500 text-sm">Memuat data...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500 text-sm">Belum ada riwayat kesehatan.</td></tr>
              ) : (
                records.map((rec) => {
                  const birthDate = new Date(rec.family_member?.birth_date);
                  const ageInYears = new Date().getFullYear() - birthDate.getFullYear();
                  
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 text-sm text-slate-600">{rec.record_date}</td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-800">{rec.family_member?.name}</td>
                      <td className="py-4 px-6 text-sm text-slate-600">{ageInYears} tahun</td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-700">{rec.weight}</td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-700">{rec.height}</td>
                      <td className="py-4 px-6 text-sm text-slate-500 space-y-1">
                        {rec.head_circumference && <div className="flex gap-2"><span className="text-slate-400">LK:</span> <span className="font-medium text-slate-700">{rec.head_circumference} cm</span></div>}
                        {rec.blood_pressure && <div className="flex gap-2"><span className="text-slate-400">Tensi:</span> <span className="font-medium text-slate-700">{rec.blood_pressure}</span></div>}
                        {rec.notes && <div className="italic">"{rec.notes}"</div>}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Catat Kesehatan Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Warga (Balita / Lansia)</label>
                <select 
                  required 
                  value={memberId} 
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full border-slate-200 rounded-xl focus:ring-rose-500 focus:border-rose-500"
                >
                  <option value="">Pilih Warga...</option>
                  {familyMembers.map((fm) => (
                    <option key={fm.id} value={fm.id}>{fm.name} ({fm.nik})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Pemeriksaan</label>
                <input 
                  type="date" 
                  required 
                  value={recordDate} 
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="w-full border-slate-200 rounded-xl focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Berat Badan (kg)</label>
                  <input 
                    type="number" step="0.01"
                    required 
                    value={weight} 
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full border-slate-200 rounded-xl focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tinggi Badan (cm)</label>
                  <input 
                    type="number" step="0.01"
                    required 
                    value={height} 
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full border-slate-200 rounded-xl focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lingkar Kepala (cm)</label>
                  <input 
                    type="number" step="0.01"
                    placeholder="Opsional (Balita)"
                    value={headCirc} 
                    onChange={(e) => setHeadCirc(e.target.value)}
                    className="w-full border-slate-200 rounded-xl focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tekanan Darah</label>
                  <input 
                    type="text"
                    placeholder="Opsional (Lansia)"
                    value={bloodPressure} 
                    onChange={(e) => setBloodPressure(e.target.value)}
                    className="w-full border-slate-200 rounded-xl focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                <textarea 
                  rows={2}
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border-slate-200 rounded-xl focus:ring-rose-500 focus:border-rose-500"
                ></textarea>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl transition-colors shadow-sm shadow-rose-200">Simpan Catatan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
