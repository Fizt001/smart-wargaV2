"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PlusIcon, CheckCircleIcon, DocumentIcon, PhotoIcon, CalendarIcon, BanknotesIcon, LockClosedIcon, InformationCircleIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function KegiatanPage() {
  
  
  // Data States
  
  const [routineExpenses, setRoutineExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [rts, setRts] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Modals for Incidental
  
  
  
  

  // Modals for Routine
  const [isAddRoutineOpen, setIsAddRoutineOpen] = useState(false);
  const [isEditRoutineOpen, setIsEditRoutineOpen] = useState(false);
  const [isPayRoutineOpen, setIsPayRoutineOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);

  // Form states
  const [actFormData, setActFormData] = useState({
    title: "", description: "", activity_date: new Date().toISOString().split('T')[0], budget_proposed: "", is_all_rt: true, target_rts: [] as number[]
  });
  const [actCompleteData, setActCompleteData] = useState({
    actual_expense: "", receipt_proof: null as File | null, photo_proof: null as File | null
  });

  const [routineFormData, setRoutineFormData] = useState({
    title: "", description: "", amount: "", target_amount: "", per_kk_amount: "", is_all_rt: true, target_rts: [] as number[]
  });
  const [routineEditData, setRoutineEditData] = useState({
    id: null, title: "", description: "", amount: ""
  });
  const [routinePayData, setRoutinePayData] = useState({
    actual_expense: "", receipt_proof: null as File | null, photo_proof: null as File | null
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const fetchList = [
        fetch("http://localhost:8000/api/user", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8000/api/master-data", { headers: { Authorization: `Bearer ${token}`, "Accept": "application/json" } })
      ];

      
        fetchList.push(fetch(`http://localhost:8000/api/routine-expenses?year=${selectedYear}`, { headers: { Authorization: `Bearer ${token}` } }));

      const [resUser, resMaster, resData] = await Promise.all(fetchList);

      const user = await resUser.json();
      setUserData(user);

      const masterData = await resMaster.json();
      if (masterData.status === 'success') setRts(masterData.data.rts);

      const data = await resData.json();
      if (data.status === 'success') {
        setRoutineExpenses(data.data);
      }
    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  

  

  const handleAddRoutineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const payload: any = {
        title: routineFormData.title,
        description: routineFormData.description,
      };

      if ([1, 2, 4, 5].includes(userData?.role_id)) {
        payload.target_amount = routineFormData.target_amount;
        payload.per_kk_amount = routineFormData.per_kk_amount;
        payload.amount = 0;
        payload.rt_ids = routineFormData.is_all_rt ? rts.map(r => r.id) : routineFormData.target_rts;
      } else {
        payload.amount = routineFormData.amount;
      }

      const res = await fetch("http://localhost:8000/api/routine-expenses", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message);
      setIsAddRoutineOpen(false);
      setRoutineFormData({ title: "", description: "", amount: "", target_amount: "", per_kk_amount: "", is_all_rt: true, target_rts: [] as number[] });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal");
    }
  };

  const handleEditRoutineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/routine-expenses/${routineEditData.id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
            title: routineEditData.title,
            description: routineEditData.description,
            amount: routineEditData.amount
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message);
      setIsEditRoutineOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal");
    }
  };

  const handleDeleteRoutine = async (id: number) => {
    const result = await MySwal.fire({
      title: 'Hapus Master Rutin?',
      text: 'Semua history pembayarannya akan ikut terhapus secara permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Batal',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (!result.isConfirmed) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/routine-expenses/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal");
    }
  };

  const handlePayRoutineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routinePayData.receipt_proof) return toast.error("Nota wajib diunggah!");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('month', selectedMonth.toString());
      formData.append('year', selectedYear.toString());
      formData.append('actual_expense', routinePayData.actual_expense);
      formData.append('receipt_proof', routinePayData.receipt_proof);
      if (routinePayData.photo_proof) formData.append('photo_proof', routinePayData.photo_proof);
      
      const res = await fetch(`http://localhost:8000/api/routine-expenses/${selectedRoutine.id}/pay`, {
        method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message);
      setIsPayRoutineOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Gagal");
    }
  };

  const formatRupiah = (num: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  const renderRoutineMonths = (routine: any) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
        {MONTHS.map((monthName, index) => {
          const monthNum = index + 1;
          const record = routine.records?.find((r: any) => r.month === monthNum);
          
          let isLocked = false;
          if (!record && monthNum > 1) {
            const prevRecord = routine.records?.find((r: any) => r.month === monthNum - 1);
            if (!prevRecord) isLocked = true;
          }

          if (record) {
            return (
              <div key={monthNum} className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col items-center text-center shadow-sm">
                <CheckCircleIcon className="w-6 h-6 text-emerald-500 mb-1" />
                <span className="text-xs font-bold text-emerald-700">{monthName}</span>
                <span className="text-[10px] text-emerald-600 mt-1">{formatRupiah(record.actual_expense)}</span>
                <a href={`http://localhost:8000/storage/${record.receipt_proof}`} target="_blank" className="text-[10px] text-blue-600 hover:underline mt-1">Lihat Nota</a>
              </div>
            );
          }

          if (isLocked) {
            return (
              <div key={monthNum} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center text-center opacity-70">
                <LockClosedIcon className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs font-medium text-slate-500">{monthName}</span>
              </div>
            );
          }

          return (
            <button 
              key={monthNum}
              onClick={() => {
                setSelectedRoutine(routine);
                setSelectedMonth(monthNum);
                
                let defaultAmount = routine.amount;
                if (routine.level === 'RW' && !isAdmin && routine.rts && routine.rts.length > 0) {
                    defaultAmount = routine.rts[0].pivot.total_kk * routine.rts[0].pivot.per_kk_amount;
                }
                
                setRoutinePayData({ actual_expense: defaultAmount, receipt_proof: null, photo_proof: null });
                setIsPayRoutineOpen(true);
              }}
              className="bg-white border border-blue-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-3 flex flex-col items-center text-center shadow-sm transition-all group"
            >
              <BanknotesIcon className="w-6 h-6 text-blue-400 group-hover:text-blue-600 mb-1" />
              <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">{monthName}</span>
              <span className="text-[10px] font-medium text-blue-600 mt-1">Bayar</span>
            </button>
          );
        })}
      </div>
    );
  };

  const isAdmin = userData && userData.role_id < 8;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Kas & Iuran</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola pencatatan iuran wajib dan pengeluaran rutin RT/RW.</p>
        </div>
        
        {(
          <div className="flex items-center space-x-3">
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-700">
              {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => (
                <option key={y} value={y}>Tahun {y}</option>
              ))}
            </select>
            {isAdmin && (
              <button onClick={() => setIsAddRoutineOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg shadow-purple-500/30 flex items-center">
                <PlusIcon className="w-5 h-5 mr-1" /> Master Rutin Baru
              </button>
            )}
          </div>
        )}

        
      </div>


      {isLoading ? (
        <div className="text-center py-10 text-slate-500">Memuat data...</div>
      ) : (
        <>
          {/* ROUTINE MASTERS */}
          {(
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start">
                <InformationCircleIcon className="w-6 h-6 text-blue-500 mr-3 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-bold mb-1">Cara Kerja Sistem 12 Bulan</p>
                  <p>Anda hanya perlu membuat "Master" satu kali (contoh: Gaji Satpam). Sistem akan otomatis menyediakan slot 12 bulan (Januari - Desember) secara permanen untuk setiap tahunnya. Pembayaran bulan berikutnya akan terbuka setelah bulan sebelumnya dilunasi.</p>
                </div>
              </div>

              {routineExpenses.length === 0 ? (
                <div className="text-center py-10 text-slate-500 bg-white rounded-2xl border border-dashed">Belum ada master pengeluaran rutin.</div>
              ) : routineExpenses.map(routine => (
                <div key={routine.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Dana {routine.level}</span>
                        <h3 className="font-bold text-slate-800 text-xl">{routine.title}</h3>
                      </div>
                      
                      {routine.level === 'RW' ? (
                        <>
                          <p className="text-slate-500 text-sm mb-1">{routine.description}</p>
                          <div className="flex items-center text-sm">
                            <span className="font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-lg mr-2">Target: {formatRupiah(routine.target_amount)} / Bln</span>
                            <span className="font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded-lg">Porsi: {formatRupiah(routine.rts?.[0]?.pivot?.per_kk_amount || routine.per_kk_amount || 0)} / KK</span>
                          </div>
                          {!isAdmin && routine.rts && routine.rts.length > 0 && (
                            <p className="text-xs font-bold text-red-500 mt-2">
                              Total Tunggakan RT Anda: {routine.rts[0].pivot.total_kk} Warga × {formatRupiah(routine.rts[0].pivot.per_kk_amount)} = {formatRupiah(routine.rts[0].pivot.total_kk * routine.rts[0].pivot.per_kk_amount)}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-slate-500 text-sm">{routine.description} &bull; Rencana: <span className="font-medium text-slate-700">{formatRupiah(routine.amount)}</span> / Bulan</p>
                      )}
                    </div>
                    {isAdmin && !(routine.level === 'RW' && [3, 6, 7].includes(userData?.role_id)) && (
                        <div className="flex gap-2">
                            <button onClick={() => {
                                setRoutineEditData({ id: routine.id, title: routine.title, description: routine.description, amount: routine.amount });
                                setIsEditRoutineOpen(true);
                            }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <PencilIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDeleteRoutine(routine.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                  </div>
                  <div className="p-5">
                    {renderRoutineMonths(routine)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* --- MODALS --- */}
      {/* 3. Modal Master Routine */}
      {isAddRoutineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Master Pengeluaran Rutin Baru</h3>
            <form onSubmit={handleAddRoutineSubmit} className="space-y-4">
              <input type="text" required value={routineFormData.title} onChange={e => setRoutineFormData({...routineFormData, title: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" placeholder="Nama: Cth: Gaji Satpam" />
              <textarea rows={2} value={routineFormData.description} onChange={e => setRoutineFormData({...routineFormData, description: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" placeholder="Keterangan..." />
              
              {[1, 2, 4, 5].includes(userData?.role_id) ? (
                <>
                  <input type="number" required min="0" value={routineFormData.target_amount} onChange={e => setRoutineFormData({...routineFormData, target_amount: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" placeholder="Rencana Pengeluaran Global (Rp)" />
                  <input type="number" required min="0" value={routineFormData.per_kk_amount} onChange={e => setRoutineFormData({...routineFormData, per_kk_amount: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" placeholder="Porsi Beban Per KK (Rp)" />
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <label className="flex items-center space-x-2 text-sm text-slate-700 font-bold mb-2 cursor-pointer">
                      <input type="checkbox" checked={routineFormData.is_all_rt} onChange={(e) => setRoutineFormData({...routineFormData, is_all_rt: e.target.checked})} className="rounded text-purple-600 focus:ring-purple-500" />
                      <span>Berlaku untuk Semua RT</span>
                    </label>
                    {!routineFormData.is_all_rt && (
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200">
                        {rts.map((rt: any) => (
                          <label key={rt.id} className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer">
                            <input type="checkbox" 
                              checked={routineFormData.target_rts.includes(rt.id)} 
                              onChange={(e) => {
                                const newRts = e.target.checked 
                                  ? [...routineFormData.target_rts, rt.id]
                                  : routineFormData.target_rts.filter(id => id !== rt.id);
                                setRoutineFormData({...routineFormData, target_rts: newRts});
                              }} 
                              className="rounded text-purple-600 focus:ring-purple-500" />
                            <span>{rt.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <input type="number" required min="0" value={routineFormData.amount} onChange={e => setRoutineFormData({...routineFormData, amount: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" placeholder="Biaya Per Bulan (Rp)" />
              )}
              
              <div className="flex justify-end pt-4"><button type="button" onClick={() => setIsAddRoutineOpen(false)} className="px-5 py-2 text-slate-600">Batal</button><button type="submit" className="px-5 py-2 text-white bg-purple-600 rounded-xl">Simpan Master</button></div>
            </form>
          </div>
        </div>
      )}

      {isEditRoutineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Edit Master Pengeluaran Rutin</h3>
            <form onSubmit={handleEditRoutineSubmit} className="space-y-4">
              <input type="text" required value={routineEditData.title} onChange={e => setRoutineEditData({...routineEditData, title: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" placeholder="Nama: Cth: Gaji Satpam" />
              <textarea rows={2} value={routineEditData.description || ""} onChange={e => setRoutineEditData({...routineEditData, description: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" placeholder="Keterangan..." />
              <input type="number" required min="0" value={routineEditData.amount} onChange={e => setRoutineEditData({...routineEditData, amount: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" placeholder="Biaya Per Bulan (Rp)" />
              <div className="flex justify-end pt-4"><button type="button" onClick={() => setIsEditRoutineOpen(false)} className="px-5 py-2 text-slate-600">Batal</button><button type="submit" className="px-5 py-2 text-white bg-blue-600 rounded-xl">Simpan Perubahan</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Pay Routine Month */}
      {isPayRoutineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border-t-4 border-blue-500">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Bayar {selectedRoutine?.title}</h3>
            <p className="text-slate-500 text-sm mb-4 pb-4 border-b font-medium">Untuk Bulan: <span className="font-bold text-blue-600">{MONTHS[selectedMonth - 1]} {selectedYear}</span></p>
            <form onSubmit={handlePayRoutineSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Nominal Aktual (Bisa disesuaikan)</label>
                <input type="number" required min="0" value={routinePayData.actual_expense} onChange={e => setRoutinePayData({...routinePayData, actual_expense: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl font-bold text-slate-700" placeholder="0" />
              </div>
              
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Upload Nota (Wajib)</label>
                <div className="border border-slate-200 bg-slate-50 rounded-xl p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                  <input type="file" required onChange={e => setRoutinePayData({...routinePayData, receipt_proof: e.target.files ? e.target.files[0] : null})} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1">Upload Foto (Opsional)</label>
                <div className="border border-slate-200 bg-slate-50 rounded-xl p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                  <input type="file" onChange={e => setRoutinePayData({...routinePayData, photo_proof: e.target.files ? e.target.files[0] : null})} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer" />
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setIsPayRoutineOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl mr-2 transition-colors">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all">Proses Pembayaran</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
