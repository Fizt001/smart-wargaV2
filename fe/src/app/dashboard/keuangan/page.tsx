"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PlusIcon, PencilSquareIcon, TrashIcon, ArrowDownIcon, ArrowUpIcon, BanknotesIcon } from "@heroicons/react/24/outline";
import FinanceFormModal from "@/components/modals/FinanceFormModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";

export default function KeuanganPage() {
  const [finances, setFinances] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 });
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [userData, setUserData] = useState<any>(null);
  const [selectedRt, setSelectedRt] = useState("");
  const [rts, setRts] = useState<any[]>([]);
  
  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedFinance, setSelectedFinance] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      let url = `${apiUrl}/api/finances`;
      if (selectedRt) url += `?rt_id=${selectedRt}`;
      
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setFinances(data.data.transactions);
        setSummary(data.data.summary);
      }

      const resCat = await fetch(`${apiUrl}/api/finances/categories`, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const dataCat = await resCat.json();
      if (dataCat.status === 'success') {
        setCategories(dataCat.data);
      }
    } catch (error) {
      toast.error("Gagal mengambil data keuangan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      try {
        const resUser = await fetch("http://localhost:8000/api/user", { headers: { Authorization: `Bearer ${token}` } });
        const user = await resUser.json();
        setUserData(user);
        if ([1, 2, 4, 5].includes(user.role_id)) {
          const resRt = await fetch("http://localhost:8000/api/rts", { headers: { Authorization: `Bearer ${token}` } });
          const rtData = await resRt.json();
          setRts(rtData.data || []);
        }
      } catch(e) {}
    };
    init();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedRt, userData]);

  const handleOpenAdd = () => {
    setSelectedFinance(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (finance: any) => {
    setSelectedFinance(finance);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (finance: any) => {
    setSelectedFinance(finance);
    setIsDeleteOpen(true);
  };

  const handleSaveFinance = async (formData: any) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const url = selectedFinance 
        ? `${apiUrl}/api/finances/${selectedFinance.id}` 
        : `${apiUrl}/api/finances`;
      const method = selectedFinance ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Terjadi kesalahan");

      toast.success(data.message);
      fetchData(); // Reload data
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan transaksi");
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedFinance) return;
    setIsDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${apiUrl}/api/finances/${selectedFinance.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });

      if (!res.ok) throw new Error("Gagal menghapus");

      toast.success("Transaksi berhasil dihapus");
      fetchData();
      setIsDeleteOpen(false);
    } catch (error) {
      toast.error("Gagal menghapus transaksi");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Keuangan & Kas RT</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola transparansi dana iuran dan pengeluaran.</p>
        </div>
        <div className="flex items-center space-x-3">
          {userData && [1, 2, 4, 5].includes(userData.role_id) && (
            <select
              value={selectedRt}
              onChange={(e) => setSelectedRt(e.target.value)}
              className="p-2 border border-slate-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 font-medium text-slate-700 shadow-sm"
            >
              <option value="">Semua RT</option>
              {rts.map(rt => (
                <option key={rt.id} value={rt.id}>{rt.name}</option>
              ))}
            </select>
          )}
          <button 
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Catat Pemasukan (Donatur)</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full opacity-50"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <BanknotesIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Sisa Saldo Kas</p>
              <p className="text-2xl font-bold text-slate-800">{formatRupiah(summary.balance)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-emerald-50 to-transparent rounded-bl-full opacity-50"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <ArrowDownIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Pemasukan</p>
              <p className="text-2xl font-bold text-emerald-600">{formatRupiah(summary.total_income)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-red-50 to-transparent rounded-bl-full opacity-50"></div>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
              <ArrowUpIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-red-600">{formatRupiah(summary.total_expense)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">Riwayat Transaksi</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Tanggal</th>
                <th className="px-6 py-4 font-medium">Kategori / Keterangan</th>
                <th className="px-6 py-4 font-medium text-right">Nominal</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Memuat data...</td>
                </tr>
              ) : finances.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Belum ada riwayat transaksi.</td>
                </tr>
              ) : (
                finances.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {formatDate(f.date)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{f.category?.name || "-"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{f.description || "Tanpa keterangan"}</p>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className={`font-semibold ${f.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {f.type === 'income' ? '+' : '-'} {formatRupiah(f.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {f.is_editable !== false ? (
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleOpenEdit(f)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <PencilSquareIcon className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleOpenDelete(f)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded">Sistem</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <FinanceFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        finance={selectedFinance}
        onSave={handleSaveFinance}
        categories={categories}
      />

      <ConfirmDeleteModal 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        title="Hapus Transaksi"
        message="Menghapus transaksi ini akan mengubah Total Saldo Kas secara permanen. Lanjutkan?"
      />
    </div>
  );
}
