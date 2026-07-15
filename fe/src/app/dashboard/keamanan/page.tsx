"use client";

import { useState, useEffect } from "react";
import { PlusIcon, ShieldCheckIcon, ClockIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import withSwal from "sweetalert2-react-content";
import Swal from "sweetalert2";

const MySwal = withSwal(Swal);

export default function KeamananPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]); // For dropdown
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"schedule" | "logs">("schedule");
  
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  const [scheduleFormData, setScheduleFormData] = useState({
    user_id: "",
    date: "",
    shift: "Malam",
    notes: ""
  });

  const [logFormData, setLogFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    incident_type: "Aman",
    description: ""
  });

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const [userRes, schedRes, logRes, usersRes] = await Promise.all([
        fetch("http://localhost:8000/api/user", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8000/api/security-schedules", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8000/api/security-logs", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8000/api/users", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (userRes.ok) setUser(await userRes.json());
      
      if (schedRes.ok) {
        const data = await schedRes.json();
        setSchedules(data.data || []);
      }

      if (logRes.ok) {
        const data = await logRes.json();
        setLogs(data.data || []);
      }

      if (usersRes.ok) {
         const udata = await usersRes.json();
         setUsers(udata.data || udata);
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

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch("http://localhost:8000/api/security-schedules", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(scheduleFormData)
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Jadwal berhasil ditambahkan!");
        setShowScheduleModal(false);
        setScheduleFormData({ user_id: "", date: "", shift: "Malam", notes: "" });
        fetchData();
      } else {
        toast.error(data.message || "Gagal menyimpan jadwal.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch("http://localhost:8000/api/security-logs", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(logFormData)
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Laporan berhasil ditambahkan!");
        setShowLogModal(false);
        setLogFormData({ 
          date: new Date().toISOString().split('T')[0], 
          time: new Date().toTimeString().split(' ')[0].substring(0, 5), 
          incident_type: "Aman", 
          description: "" 
        });
        fetchData();
        setActiveTab("logs");
      } else {
        toast.error(data.message || "Gagal menyimpan laporan.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleUpdateScheduleStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/security-schedules/${id}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Status kehadiran diperbarui!");
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Keamanan Lingkungan</h1>
            <p className="text-slate-500 text-sm mt-1">
              Jadwal siskamling warga dan log buku tamu / kejadian keamanan.
            </p>
          </div>
          {isPengurus && (
            <div className="flex space-x-3 w-full md:w-auto">
              <button 
                onClick={() => { setShowScheduleModal(true); setActiveTab('schedule'); }}
                className="flex-1 md:flex-none bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Jadwal Ronda</span>
              </button>
              <button 
                onClick={() => { setShowLogModal(true); setActiveTab('logs'); }}
                className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Log Kejadian</span>
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 py-4 text-sm font-bold transition-colors flex items-center justify-center space-x-2 ${activeTab === 'schedule' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <ShieldCheckIcon className="w-5 h-5" />
              <span>Jadwal Siskamling</span>
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-4 text-sm font-bold transition-colors flex items-center justify-center space-x-2 ${activeTab === 'logs' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <DocumentTextIcon className="w-5 h-5" />
              <span>Buku Tamu / Kejadian</span>
            </button>
          </div>

          <div className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Memuat data...</div>
            ) : activeTab === 'schedule' ? (
              schedules.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-slate-500">
                  <ClockIcon className="w-16 h-16 text-slate-200 mb-4" />
                  <p>Belum ada jadwal siskamling / ronda bulan ini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Tanggal</th>
                        <th className="px-6 py-4">Shift</th>
                        <th className="px-6 py-4">Nama Warga</th>
                        <th className="px-6 py-4">Catatan</th>
                        <th className="px-6 py-4">Status Kehadiran</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schedules.map((sched) => (
                        <tr key={sched.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{new Date(sched.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                          <td className="px-6 py-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{sched.shift}</span></td>
                          <td className="px-6 py-4 font-bold">{sched.user?.name}</td>
                          <td className="px-6 py-4">{sched.notes || '-'}</td>
                          <td className="px-6 py-4">
                            {sched.status === 'pending' && <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold flex items-center w-fit"><ClockIcon className="w-3 h-3 mr-1" /> Menunggu</span>}
                            {sched.status === 'present' && <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold flex items-center w-fit"><CheckCircleIcon className="w-3 h-3 mr-1" /> Hadir</span>}
                            {sched.status === 'absent' && <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold flex items-center w-fit"><XCircleIcon className="w-3 h-3 mr-1" /> Mangkir</span>}
                            {sched.status === 'excused' && <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-bold flex items-center w-fit">Izin</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {(isPengurus || (user && user.id === sched.user_id)) && sched.status === 'pending' && (
                              <div className="flex space-x-2 justify-center">
                                <button onClick={() => handleUpdateScheduleStatus(sched.id, 'present')} className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded font-bold">Hadir</button>
                                <button onClick={() => handleUpdateScheduleStatus(sched.id, 'excused')} className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded font-bold">Izin</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              logs.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-slate-500">
                  <DocumentTextIcon className="w-16 h-16 text-slate-200 mb-4" />
                  <p>Belum ada catatan kejadian atau laporan buku tamu.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Waktu</th>
                        <th className="px-6 py-4">Dilaporkan Oleh</th>
                        <th className="px-6 py-4">Kategori Kejadian</th>
                        <th className="px-6 py-4">Deskripsi / Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-slate-800">{new Date(log.date).toLocaleDateString('id-ID')}</div>
                            <div className="text-xs text-slate-500">{log.time} WIB</div>
                          </td>
                          <td className="px-6 py-4 font-bold">{log.reporter?.name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              log.incident_type === 'Aman' ? 'bg-emerald-100 text-emerald-700' : 
                              log.incident_type === 'Tamu Tak Dikenal' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {log.incident_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-700">{log.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* MODAL JADWAL RONDA ADMIN */}
      {showScheduleModal && isPengurus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Tambah Jadwal Ronda</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Warga</label>
                <select required value={scheduleFormData.user_id} onChange={(e) => setScheduleFormData({...scheduleFormData, user_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                  <option value="" disabled>-- Pilih Warga --</option>
                  {users.filter(u => u.role_id >= 3).map(u => (
                    <option key={u.id} value={u.id}>{u.name} (RT {u.rt_id})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal</label>
                  <input required type="date" value={scheduleFormData.date} onChange={(e) => setScheduleFormData({...scheduleFormData, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Shift</label>
                  <select required value={scheduleFormData.shift} onChange={(e) => setScheduleFormData({...scheduleFormData, shift: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                    <option value="Malam">Malam (20:00 - 04:00)</option>
                    <option value="Siang">Siang (08:00 - 16:00)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Catatan Tambahan</label>
                <input type="text" value={scheduleFormData.notes} onChange={(e) => setScheduleFormData({...scheduleFormData, notes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2" placeholder="Wajib bawa senter" />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold">Batal</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Simpan Jadwal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LOG KEJADIAN ADMIN */}
      {showLogModal && isPengurus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Catat Log Keamanan</h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleLogSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal</label>
                  <input required type="date" value={logFormData.date} onChange={(e) => setLogFormData({...logFormData, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Waktu (Jam)</label>
                  <input required type="time" value={logFormData.time} onChange={(e) => setLogFormData({...logFormData, time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Jenis Kejadian</label>
                <select required value={logFormData.incident_type} onChange={(e) => setLogFormData({...logFormData, incident_type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                  <option value="Aman">Kondisi Aman / Kondusif</option>
                  <option value="Tamu Tak Dikenal">Tamu / Kendaraan Tak Dikenal</option>
                  <option value="Keributan">Keributan / Perselisihan Warga</option>
                  <option value="Pencurian">Indikasi Pencurian</option>
                  <option value="Bencana">Bencana (Banjir, Kebakaran)</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi Detail</label>
                <textarea required rows={3} value={logFormData.description} onChange={(e) => setLogFormData({...logFormData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2" placeholder="Tulis rincian kejadian di sini..."></textarea>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowLogModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold">Batal</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Simpan Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
