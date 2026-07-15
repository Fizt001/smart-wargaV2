"use client";

import { useState, useEffect } from "react";
import { PlusIcon, BuildingStorefrontIcon, CheckCircleIcon, XCircleIcon, ClockIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import withSwal from "sweetalert2-react-content";
import Swal from "sweetalert2";

const MySwal = withSwal(Swal);

export default function AsetPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [rts, setRts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"assets" | "borrowings">("assets");
  
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedBorrowing, setSelectedBorrowing] = useState<any>(null);

  const [assetFormData, setAssetFormData] = useState({
    name: "",
    category: "",
    quantity: 1,
    condition: "good",
    condition: "good",
    location: "",
    notes: "",
    source: "Kas RT",
    rt_id: ""
  });

  const [borrowFormData, setBorrowFormData] = useState({
    asset_id: "",
    quantity: 1,
    start_date: "",
    end_date: "",
    purpose: ""
  });

  const [returnFormData, setReturnFormData] = useState({
    donation_amount: 0
  });

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const [userRes, assetsRes, borrowRes] = await Promise.all([
        fetch("http://localhost:8000/api/user", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8000/api/assets", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8000/api/asset-borrowings", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (userRes.ok) {
        const u = await userRes.json();
        setUser(u.data || u); // depending on wrapping
        if ((u.data?.role_id || u?.role_id) === 1) {
          try {
            const rtRes = await fetch("http://localhost:8000/api/rts", { headers: { Authorization: `Bearer ${token}` } });
            if (rtRes.ok) {
              const rtData = await rtRes.json();
              setRts(rtData.data || []);
            }
          } catch (e) {
            console.error("Gagal mengambil RT", e);
          }
        }
      }

      if (assetsRes.ok) {
        const data = await assetsRes.json();
        setAssets(data.data || []);
      }

      if (borrowRes.ok) {
        const data = await borrowRes.json();
        setBorrowings(data.data || []);
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

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    try {
      const url = selectedAsset ? `http://localhost:8000/api/assets/${selectedAsset.id}` : "http://localhost:8000/api/assets";
      const method = selectedAsset ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(assetFormData)
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Aset berhasil disimpan!");
        setShowAssetModal(false);
        setSelectedAsset(null);
        setAssetFormData({ name: "", category: "", quantity: 1, condition: "good", location: "", notes: "" });
        fetchData();
      } else {
        toast.error(data.message || "Gagal menyimpan aset.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleDeleteAsset = async (id: number) => {
    MySwal.fire({
      title: "Hapus Aset",
      html: `
        <p class="text-sm text-slate-500 mb-4">Masukkan alasan penghapusan (wajib untuk pencatatan inventaris RT):</p>
        <input id="swal-input-reason" class="swal2-input border-slate-200 rounded-xl" placeholder="Contoh: Rusak total" style="width: 80%">
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      preConfirm: () => {
        const reason = (document.getElementById('swal-input-reason') as HTMLInputElement).value;
        if (!reason) {
          Swal.showValidationMessage('Alasan penghapusan wajib diisi');
        }
        return reason;
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        try {
          const res = await fetch(`http://localhost:8000/api/assets/${id}`, {
            method: "DELETE",
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ deleted_reason: result.value })
          });
          const data = await res.json();
          if (res.ok) {
            toast.success(data.message || "Aset berhasil dihapus.");
            fetchData();
          } else {
            toast.error(data.message || "Gagal menghapus aset.");
          }
        } catch (err) {
          console.error(err);
          toast.error("Terjadi kesalahan jaringan.");
        }
      }
    });
  };

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch("http://localhost:8000/api/asset-borrowings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(borrowFormData)
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Permohonan pinjam diajukan!");
        setShowBorrowModal(false);
        setBorrowFormData({ asset_id: "", quantity: 1, start_date: "", end_date: "", purpose: "" });
        fetchData();
        setActiveTab("borrowings");
      } else {
        toast.error(data.message || "Gagal mengajukan pinjaman.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleUpdateBorrowStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/asset-borrowings/${id}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Status peminjaman diperbarui!");
        fetchData();
      } else {
        toast.error(data.message || "Gagal memperbarui status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`http://localhost:8000/api/asset-borrowings/${selectedBorrowing.id}/return`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(returnFormData)
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Aset berhasil dikembalikan!");
        setShowReturnModal(false);
        setReturnFormData({ donation_amount: 0 });
        setSelectedBorrowing(null);
        fetchData();
      } else {
        toast.error(data.message || "Gagal mengembalikan aset.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const isPengurus = user && user.role_id <= 7;
  const isSekretarisRT = user && user.role_id === 6;
  const canEditAset = user && (user.role_id === 1 || user.role_id === 6);
  const isPengurusRW = user && [1, 2, 4, 5].includes(user.role_id);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Aset & Fasilitas RT</h1>
            <p className="text-slate-500 text-sm mt-1">
              Inventaris fasilitas umum dan layanan peminjaman aset untuk warga tingkat RT.
            </p>
          </div>
          {canEditAset && activeTab === 'assets' && (
            <button 
              onClick={() => {
                setSelectedAsset(null);
                setAssetFormData({ name: "", category: "", quantity: 1, condition: "good", location: "", notes: "", source: "Kas RT", rt_id: "" });
                setShowAssetModal(true);
              }}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Tambah Aset</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setActiveTab('assets')}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'assets' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Daftar Aset
            </button>
            <button 
              onClick={() => setActiveTab('borrowings')}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'borrowings' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Riwayat Peminjaman {borrowings.filter(b => b.status === 'pending').length > 0 && isPengurus && <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs ml-2">{borrowings.filter(b => b.status === 'pending').length}</span>}
            </button>
          </div>

          <div className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Memuat data...</div>
            ) : activeTab === 'assets' ? (
              assets.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-slate-500">
                  <BuildingStorefrontIcon className="w-16 h-16 text-slate-200 mb-4" />
                  <p>Belum ada aset terdaftar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Nama Aset</th>
                        <th className="px-6 py-4">Kategori</th>
                        <th className="px-6 py-4">Jumlah</th>
                        {isPengurusRW && <th className="px-6 py-4">Milik RT</th>}
                        <th className="px-6 py-4">Kondisi</th>
                        <th className="px-6 py-4">Lokasi</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {assets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{asset.name}</td>
                          <td className="px-6 py-4">{asset.category}</td>
                          <td className="px-6 py-4 font-bold">{asset.quantity} unit</td>
                          {isPengurusRW && <td className="px-6 py-4"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">{asset.rt?.name || '-'}</span></td>}
                          <td className="px-6 py-4">
                            {asset.condition === 'good' && <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold">Baik</span>}
                            {asset.condition === 'damaged' && <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold">Rusak</span>}
                            {asset.condition === 'maintenance' && <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold">Perbaikan</span>}
                          </td>
                          <td className="px-6 py-4">{asset.location || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-3">
                              {canEditAset && (
                                <>
                                  <button 
                                    onClick={() => {
                                      setSelectedAsset(asset);
                                      setAssetFormData({
                                        name: asset.name, category: asset.category, quantity: asset.quantity,
                                        condition: asset.condition, location: asset.location || "", notes: asset.notes || "",
                                        source: asset.source || "Kas RT", rt_id: asset.rt_id?.toString() || ""
                                      });
                                      setShowAssetModal(true);
                                    }}
                                    className="text-xs font-bold text-blue-600 hover:underline"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteAsset(asset.id)}
                                    className="text-xs font-bold text-red-600 hover:underline"
                                  >
                                    Hapus
                                  </button>
                                </>
                              )}
                              <button 
                                onClick={() => {
                                  if (asset.condition !== 'good') {
                                    toast.error("Aset ini tidak dapat dipinjam saat ini.");
                                    return;
                                  }
                                  setBorrowFormData({...borrowFormData, asset_id: asset.id.toString(), quantity: 1});
                                  setShowBorrowModal(true);
                                }}
                                disabled={asset.condition !== 'good'}
                                className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg disabled:opacity-50"
                              >
                                Pinjam
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              borrowings.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-slate-500">
                  <ClockIcon className="w-16 h-16 text-slate-200 mb-4" />
                  <p>Belum ada riwayat peminjaman.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Peminjam</th>
                        <th className="px-6 py-4">Aset</th>
                        <th className="px-6 py-4">Jumlah</th>
                        <th className="px-6 py-4">Tgl Pinjam</th>
                        <th className="px-6 py-4">Tgl Kembali</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {borrowings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{b.user?.name}</td>
                          <td className="px-6 py-4 font-medium">{b.asset?.name}</td>
                          <td className="px-6 py-4">{b.quantity}</td>
                          <td className="px-6 py-4">{new Date(b.start_date).toLocaleDateString('id-ID')}</td>
                          <td className="px-6 py-4">{new Date(b.end_date).toLocaleDateString('id-ID')}</td>
                          <td className="px-6 py-4">
                            {b.status === 'pending' && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">Menunggu</span>}
                            {b.status === 'approved' && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">Dipinjam</span>}
                            {b.status === 'returned' && <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">Dikembalikan</span>}
                            {b.status === 'rejected' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Ditolak</span>}
                          </td>
                          <td className="px-6 py-4 text-center space-x-2">
                            {canEditAset && b.status === 'pending' && (
                              <>
                                <button onClick={() => handleUpdateBorrowStatus(b.id, 'approved')} className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-2 py-1 rounded">ACC</button>
                                <button onClick={() => handleUpdateBorrowStatus(b.id, 'rejected')} className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded">Tolak</button>
                              </>
                            )}
                            {canEditAset && b.status === 'approved' && (
                              <button onClick={() => handleUpdateBorrowStatus(b.id, 'returned')} className="text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded">Selesai/Kembali</button>
                            )}
                            {!canEditAset && b.status === 'approved' && (
                              <button 
                                onClick={() => {
                                  setSelectedBorrowing(b);
                                  setReturnFormData({ donation_amount: 0 });
                                  setShowReturnModal(true);
                                }}
                                className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg"
                              >
                                Kembalikan Aset
                              </button>
                            )}
                          </td>
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

      {/* MODAL ASSET ADMIN */}
      {showAssetModal && canEditAset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{selectedAsset ? "Edit Aset" : "Tambah Aset"}</h3>
              <button onClick={() => setShowAssetModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleAssetSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nama Barang</label>
                <input required type="text" value={assetFormData.name} onChange={(e) => setAssetFormData({...assetFormData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Kategori</label>
                  <input required type="text" value={assetFormData.category} onChange={(e) => setAssetFormData({...assetFormData, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2" placeholder="Tenda, Kursi, dll" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah Unit</label>
                  <input required type="number" min="1" value={assetFormData.quantity} onChange={(e) => setAssetFormData({...assetFormData, quantity: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Kondisi</label>
                <select value={assetFormData.condition} onChange={(e) => setAssetFormData({...assetFormData, condition: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                  <option value="good">Baik</option>
                  <option value="damaged">Rusak</option>
                  <option value="maintenance">Dalam Perbaikan</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Sumber Aset</label>
                  <select value={assetFormData.source} onChange={(e) => setAssetFormData({...assetFormData, source: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                    <option value="Kas RT">Kas RT</option>
                    <option value="Donasi Warga">Donasi Warga</option>
                    <option value="Bantuan Pemerintah">Bantuan Pemerintah</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                {user?.role_id === 1 && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Milik RT</label>
                    <select required value={assetFormData.rt_id} onChange={(e) => setAssetFormData({...assetFormData, rt_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                      <option value="">-- Pilih RT --</option>
                      {rts.map((rt: any) => (
                        <option key={rt.id} value={rt.id}>{rt.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Lokasi Penyimpanan</label>
                <input type="text" value={assetFormData.location} onChange={(e) => setAssetFormData({...assetFormData, location: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2" placeholder="Gudang RT" />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowAssetModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold">Batal</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PINJAM WARGA */}
      {showBorrowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Form Peminjaman Barang</h3>
              <button onClick={() => setShowBorrowModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleBorrowSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah Dipinjam</label>
                <input required type="number" min="1" value={borrowFormData.quantity} onChange={(e) => setBorrowFormData({...borrowFormData, quantity: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tgl Pinjam</label>
                  <input required type="date" value={borrowFormData.start_date} onChange={(e) => setBorrowFormData({...borrowFormData, start_date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tgl Kembali</label>
                  <input required type="date" value={borrowFormData.end_date} onChange={(e) => setBorrowFormData({...borrowFormData, end_date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Keperluan</label>
                <textarea required rows={3} value={borrowFormData.purpose} onChange={(e) => setBorrowFormData({...borrowFormData, purpose: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2" placeholder="Acara tahlilan..."></textarea>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowBorrowModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold">Batal</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">Ajukan Peminjaman</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KEMBALIKAN ASET (WARGA) */}
      {showReturnModal && !isPengurus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Kembalikan Aset</h3>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleReturnSubmit} className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 border border-blue-100">
                <p>Anda akan mengembalikan aset: <strong>{selectedBorrowing?.asset?.name}</strong>.</p>
                <p className="mt-1">Terima kasih telah menggunakan fasilitas RW dengan baik!</p>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Donasi Kas RW (Opsional)</label>
                <p className="text-xs text-slate-500 mb-2">Sebagai bentuk dukungan, Anda dapat berdonasi. Biaya akan dipotong langsung dari <strong>Saldo Warga</strong> Anda.</p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-bold">Rp</span>
                  </div>
                  <input 
                    type="number" 
                    min="0" 
                    value={returnFormData.donation_amount} 
                    onChange={(e) => setReturnFormData({...returnFormData, donation_amount: parseInt(e.target.value) || 0})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>
                <div className="text-xs text-slate-500 mt-2">Saldo Anda saat ini: <strong className={user?.wallet_balance < returnFormData.donation_amount ? 'text-red-500' : 'text-emerald-600'}>Rp {user?.wallet_balance?.toLocaleString('id-ID')}</strong></div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowReturnModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold">Batal</button>
                <button 
                  type="submit" 
                  disabled={user?.wallet_balance < returnFormData.donation_amount}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  Proses Pengembalian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
