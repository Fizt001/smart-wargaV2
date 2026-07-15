"use client";

import { useState, useEffect } from "react";
import { 
  CalendarDaysIcon, 
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  TrashIcon,
  MegaphoneIcon
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Link from "next/link";

export default function AgendaPage() {
  const [agendas, setAgendas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [selectedAgenda, setSelectedAgenda] = useState<any>(null);
  const [rsvpStatus, setRsvpStatus] = useState<'attending' | 'absent'>('attending');
  const [rsvpReason, setRsvpReason] = useState("");
  
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isAddActOpen, setIsAddActOpen] = useState(false);
  const [actFormData, setActFormData] = useState({
    title: "", type: "informasi", description: "", activity_date: new Date().toISOString().split('T')[0], budget_proposed: "", is_all_rt: true, target_rts: [] as number[]
  });
  const [rts, setRts] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const [res, resWallet, resMaster] = await Promise.all([
        fetch(`${apiUrl}/api/warga/agendas?type=informasi`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/wallet`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/master-data`, { headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" } })
      ]);

      const [data, dataWallet, masterData] = await Promise.all([
        res.json(),
        resWallet.json(),
        resMaster.json()
      ]);

      if (data.status === 'success') setAgendas(data.data);
      if (masterData.status === 'success') setRts(masterData.data.rts);
      if (dataWallet.status === 'success') setWalletBalance(dataWallet.data.balance);
      
      const userData = localStorage.getItem("user");
      if (userData) setUser(JSON.parse(userData));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAgenda = async (id: number, title: string) => {
    if (!window.confirm(`Yakin ingin menghapus "${title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/activities/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAgendas(prev => prev.filter(a => a.id !== id));
      } else {
        alert(data.message || 'Gagal menghapus agenda');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan, coba lagi.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

    const handleAddActSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/activities`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(actFormData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setIsAddActOpen(false);
      setActFormData({ title: "", type: "informasi", description: "", activity_date: new Date().toISOString().split('T')[0], budget_proposed: "", is_all_rt: true, target_rts: [] });
      fetchData();
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/warga/agendas/${selectedAgenda.id}/rsvp`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: rsvpStatus, reason: rsvpStatus === 'absent' ? rsvpReason : null })
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage("RSVP berhasil disimpan!");
        setTimeout(() => {
          setIsRsvpModalOpen(false);
          fetchData();
        }, 1500);
      } else {
        setMessage(data.message || "Terjadi kesalahan");
      }
    } catch (err) {
      setMessage("Kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/warga/agendas/${selectedAgenda.id}/donate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ amount: donateAmount })
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage("Donasi berhasil dilakukan!");
        setDonateAmount("");
        setTimeout(() => {
          setIsDonateModalOpen(false);
          fetchData();
        }, 1500);
      } else {
        setMessage(data.message || "Gagal donasi");
      }
    } catch (err) {
      setMessage("Kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRsvp = (agenda: any) => {
    setSelectedAgenda(agenda);
    const existing = agenda.participants?.find((p:any) => p.user_id === user?.id);
    if (existing) {
      setRsvpStatus(existing.status);
      setRsvpReason(existing.reason || "");
    } else {
      setRsvpStatus('attending');
      setRsvpReason("");
    }
    setMessage("");
    setIsRsvpModalOpen(true);
  };

  const openDonate = (agenda: any) => {
    setSelectedAgenda(agenda);
    setDonateAmount("");
    setMessage("");
    setIsDonateModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MegaphoneIcon className="w-8 h-8 text-blue-600" /> Informasi
          </h1>
          <p className="text-slate-500 text-sm mt-1">Daftar pengumuman dan informasi terkini di lingkungan Anda.</p>
        </div>
        {user && user.role_id < 8 && (
          <button onClick={() => setIsAddActOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm">
            Buat Informasi
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-slate-500 col-span-full">Memuat agenda...</p>
        ) : agendas.length === 0 ? (
          <div className="col-span-full py-16 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
            <CalendarDaysIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-600">Belum ada agenda kegiatan saat ini.</p>
          </div>
        ) : (
          agendas.map((agenda) => {
            const isExecuted = agenda.status === 'executed';
            const participant = agenda.participants?.find((p:any) => p.user_id === user?.id);
            const myDonations = agenda.donations?.filter((d:any) => d.user_id === user?.id) || [];
            const myTotalDonation = myDonations.reduce((sum:number, d:any) => sum + Number(d.amount), 0);
            const isRefunded = myDonations.some((d:any) => d.status === 'refunded');

            // Authorization: can current user delete this agenda?
            const canDelete = user && (
              user.role_id === 1 || // Superadmin
              agenda.user_id === user.id || // Creator
              user.role_id === 2 || // Ketua RW
              (user.role_id === 3 && agenda.level === 'RT' && agenda.rt_id === user.rt_id) // Ketua RT on own RT
            );

            return (
              <div key={agenda.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                <div className={`p-6 border-b border-slate-100 ${isExecuted ? 'bg-slate-50' : ''} flex-1`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        agenda.level === 'RW' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {agenda.level === 'RT' && agenda.rt ? agenda.rt.name : 'Tingkat RW'}
                      </span>
                      {agenda.type !== 'informasi' && (
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          isExecuted ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {isExecuted ? 'Selesai' : 'Akan Datang'}
                        </span>
                      )}
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteAgenda(agenda.id, agenda.title)}
                        title="Hapus Agenda"
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {agenda.type === 'informasi' && (
                    <div className="mb-3">
                      <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                        Informasi Warga
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{agenda.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{agenda.description || "Tidak ada deskripsi."}</p>
                  
                  {agenda.user && (
                    <div className="mb-4 inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                      <span className="text-xs text-slate-500 font-medium italic">Oleh: {agenda.user.name} ({agenda.user.role?.name || 'Pengurus'})</span>
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    {agenda.type === 'informasi' ? (
                      <div className="text-xs text-slate-400">
                        Diterbitkan pada: {format(new Date(agenda.created_at || agenda.activity_date), 'dd MMMM yyyy', { locale: idLocale })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CalendarDaysIcon className="w-4 h-4" />
                        <span>{format(new Date(agenda.activity_date), 'EEEE, dd MMMM yyyy', { locale: idLocale })}</span>
                      </div>
                    )}
                    {agenda.level === 'RW' && !agenda.is_all_rt && agenda.target_rts && (
                      <div className="flex gap-2 text-xs">
                        <span className="font-medium text-slate-500">Target RT:</span>
                        <div className="flex gap-1 flex-wrap">
                          {agenda.target_rts.map((rt:any) => (
                            <span key={rt.id} className="bg-slate-100 px-1.5 py-0.5 rounded">RT {rt.name}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {agenda.type !== 'informasi' && participant && (
                    <div className="mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${
                        participant.status === 'attending' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {participant.status === 'attending' ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5"/>}
                        {participant.status === 'attending' ? 'Anda Akan Hadir' : 'Anda Berhalangan'}
                      </span>
                    </div>
                  )}

                  {agenda.type !== 'informasi' && myTotalDonation > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
                        <CurrencyDollarIcon className="w-5 h-5" />
                        Donasi Anda
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-700">{formatCurrency(myTotalDonation)}</p>
                        {isRefunded && <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Sisa dana dikembalikan</p>}
                      </div>
                    </div>
                  )}
                </div>

                {agenda.type !== 'informasi' && !isExecuted && (
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                    <button 
                      onClick={() => openRsvp(agenda)}
                      className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm"
                    >
                      {participant ? 'Ubah RSVP' : 'Konfirmasi Hadir'}
                    </button>
                    <button 
                      onClick={() => openDonate(agenda)}
                      className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors text-sm"
                    >
                      Donasi Acara
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* RSVP Modal */}
      {isRsvpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Konfirmasi Kehadiran</h2>
              <p className="text-sm text-slate-500 mt-1">{selectedAgenda?.title}</p>
            </div>
            <form onSubmit={handleRsvpSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${
                    rsvpStatus === 'attending' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input type="radio" name="rsvp" className="hidden" checked={rsvpStatus === 'attending'} onChange={() => setRsvpStatus('attending')} />
                    <CheckCircleIcon className="w-8 h-8" />
                    <span className="font-medium text-sm">Hadir</span>
                  </label>
                  <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${
                    rsvpStatus === 'absent' ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input type="radio" name="rsvp" className="hidden" checked={rsvpStatus === 'absent'} onChange={() => setRsvpStatus('absent')} />
                    <XCircleIcon className="w-8 h-8" />
                    <span className="font-medium text-sm">Berhalangan</span>
                  </label>
                </div>
                
                {rsvpStatus === 'absent' && (
                  <div className="animate-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Alasan Berhalangan</label>
                    <textarea
                      value={rsvpReason}
                      onChange={(e) => setRsvpReason(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Masukkan alasan Anda..."
                      rows={3}
                    />
                  </div>
                )}

                {message && (
                  <div className={`p-3 rounded-lg text-sm flex items-center gap-2 mt-4 ${message.includes('berhasil') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {message.includes('berhasil') && <CheckCircleIcon className="w-5 h-5" />}
                    {message}
                  </div>
                )}
              </div>
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setIsRsvpModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan RSVP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Donate Modal */}
      {isDonateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-blue-50/50">
              <h2 className="text-xl font-bold text-slate-800">Donasi Sukarela Acara</h2>
              <p className="text-sm text-slate-500 mt-1">{selectedAgenda?.title}</p>
            </div>
            <form onSubmit={handleDonateSubmit} className="p-6">
              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100 flex justify-between items-center">
                <span className="text-slate-600 text-sm">Saldo Warga Anda:</span>
                <span className="font-bold text-slate-800">{formatCurrency(walletBalance)}</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nominal Donasi (Rp)</label>
                  <input
                    type="number"
                    value={donateAmount}
                    onChange={(e) => setDonateAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                    placeholder="Contoh: 50000"
                    min="1000"
                    max={walletBalance}
                    required
                  />
                  {Number(donateAmount) > walletBalance && (
                    <p className="text-xs text-red-500 mt-1">Saldo tidak mencukupi. Silakan kurangi nominal atau isi saldo.</p>
                  )}
                </div>

                {message && (
                  <div className={`p-3 rounded-lg text-sm flex items-center gap-2 mt-4 ${message.includes('berhasil') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {message.includes('berhasil') && <CheckCircleIcon className="w-5 h-5" />}
                    {message}
                  </div>
                )}
              </div>
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setIsDonateModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-50">Batal</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || Number(donateAmount) > walletBalance || !donateAmount} 
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Memproses...' : 'Kirim Donasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddActOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Sebarkan Informasi Warga</h3>
            <form onSubmit={handleAddActSubmit} className="space-y-4">
              {/* type fixed to informasi */}
              <input type="hidden" name="type" value="informasi" />
              <input type="text" required value={actFormData.title} onChange={e => setActFormData({...actFormData, title: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" placeholder="Judul Agenda" />
              <textarea rows={2} value={actFormData.description} onChange={e => setActFormData({...actFormData, description: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" placeholder="Deskripsi Singkat" />
              {actFormData.type === 'kegiatan' && (
                <input type="date" required value={actFormData.activity_date} onChange={e => setActFormData({...actFormData, activity_date: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
              )}
              {actFormData.type === 'kegiatan' && (
                <input type="number" required min="0" value={actFormData.budget_proposed} onChange={e => setActFormData({...actFormData, budget_proposed: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" placeholder="Rencana Biaya (Rp)" />
              )}
              
              {user && (user.role_id === 1 || user.role_id === 2) && (
                <div className="p-3 bg-slate-50 border rounded-xl">
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Target Peserta RT</label>
                  <div className="flex items-center space-x-2 mb-2">
                    <input 
                      type="checkbox" 
                      id="is_all_rt"
                      checked={actFormData.is_all_rt} 
                      onChange={e => setActFormData({...actFormData, is_all_rt: e.target.checked})} 
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <label htmlFor="is_all_rt" className="text-sm font-medium text-slate-700">Semua RT (Seluruh Warga Blok Erika)</label>
                  </div>
                  
                  {!actFormData.is_all_rt && (
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200">
                      {rts.map(rt => (
                        <div key={rt.id} className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id={`rt_${rt.id}`}
                            checked={actFormData.target_rts.includes(rt.id)}
                            onChange={(e) => {
                              const newTargets = e.target.checked 
                                ? [...actFormData.target_rts, rt.id]
                                : actFormData.target_rts.filter(id => id !== rt.id);
                              setActFormData({...actFormData, target_rts: newTargets});
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`rt_${rt.id}`} className="text-sm text-slate-600">{rt.name}</label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={() => setIsAddActOpen(false)} className="px-5 py-2 text-slate-600">Batal</button><button type="submit" className="px-5 py-2 text-white bg-blue-600 rounded-xl">Simpan</button></div>
            </form>
          </div>
        </div>
      )}

      
    </div>
  );
}
