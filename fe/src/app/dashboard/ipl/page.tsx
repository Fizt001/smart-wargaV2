"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  BanknotesIcon, 
  Cog6ToothIcon, 
  DocumentCheckIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  PlayIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function IplPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"master" | "generate" | "bills" | "payment_methods">("bills");

  const [components, setComponents] = useState<any[]>([]);
  const [billings, setBillings] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [showComponentForm, setShowComponentForm] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", amount: "", is_active: true });

  const [showPaymentMethodForm, setShowPaymentMethodForm] = useState(false);
  const [paymentMethodForm, setPaymentMethodForm] = useState({ id: "", bank_name: "", account_number: "", account_name: "", is_active: true });
  const [paymentMethodQr, setPaymentMethodQr] = useState<File | null>(null);

  const [showMultiPayModal, setShowMultiPayModal] = useState(false);
  const [selectedBillingIds, setSelectedBillingIds] = useState<number[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<any>(null);
  const [proofImage, setProofImage] = useState<File | null>(null);

  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const [generateMonth, setGenerateMonth] = useState(new Date().getMonth() + 1);
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);

  const [selectedWargaYear, setSelectedWargaYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, pending_count: 0 });
  const [selectedRt, setSelectedRt] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [rts, setRts] = useState<any[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch("http://localhost:8000/api/user", {
          headers: { 
            "Accept": "application/json",
            Authorization: `Bearer ${token}` 
          },
        });
        const data = await res.json();
        setUserData(data);
        if (data.role_id === 8) {
          setActiveTab("bills"); // Warga only sees bills
        } else {
          setActiveTab("master"); // Pengurus defaults to master
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    if (userData) {
      fetchComponents();
      fetchPaymentMethods();
      if ([1, 2, 4, 5].includes(userData.role_id)) {
        fetchRts();
      }
    }
  }, [userData, selectedRt]);

  useEffect(() => {
    if (userData) {
      fetchBillings();
      const interval = setInterval(() => {
        fetchBillings(true);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [userData, currentPage, selectedRt, selectedStatus]);

  const fetchRts = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:8000/api/rts", { 
        headers: { 
          "Accept": "application/json",
          Authorization: `Bearer ${token}` 
        }
      });
      const data = await res.json();
      setRts(data.data || []);
    } catch(err) { console.error(err); }
  };

  const fetchPaymentMethods = async () => {
    const token = localStorage.getItem("token");
    try {
      let url = "http://localhost:8000/api/payment-methods";
      if (selectedRt) url += `?rt_id=${selectedRt}`;
      const res = await fetch(url, {
        headers: { 
          "Accept": "application/json",
          Authorization: `Bearer ${token}` 
        }
      });
      const data = await res.json();
      setPaymentMethods(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComponents = async () => {
    if (userData?.role_id === 8) return; // Warga doesn't need to see master
    const token = localStorage.getItem("token");
    try {
      let url = "http://localhost:8000/api/billing-components";
      if (selectedRt) url += `?rt_id=${selectedRt}`;
      const res = await fetch(url, {
        headers: { 
          "Accept": "application/json",
          Authorization: `Bearer ${token}` 
        }
      });
      const data = await res.json();
      setComponents(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBillings = async (silent = false) => {
    if (!silent) setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      let url = `http://localhost:8000/api/billings?page=${currentPage}`;
      if (selectedRt) url += `&rt_id=${selectedRt}`;
      if (selectedStatus) url += `&status=${selectedStatus}`;
      const res = await fetch(url, {
        headers: { 
          "Accept": "application/json",
          Authorization: `Bearer ${token}` 
        }
      });
      const data = await res.json();
      setBillings(data.data || []);
      if (data.meta) setMeta(data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const method = formData.id ? "PUT" : "POST";
    const url = formData.id 
      ? `http://localhost:8000/api/billing-components/${formData.id}`
      : `http://localhost:8000/api/billing-components`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          amount: parseFloat(formData.amount),
          is_active: formData.is_active,
          level: userData?.role_id === 1 ? (selectedRt ? 'RT' : 'RW') : undefined,
          rt_id: userData?.role_id === 1 && selectedRt ? parseInt(selectedRt) : undefined
        })
      });
      if (res.ok) {
        setShowComponentForm(false);
        setFormData({ id: "", name: "", amount: "", is_active: true });
        fetchComponents();
        toast.success("Komponen berhasil disimpan!");
      } else {
        const errorData = await res.json();
        toast.error("Gagal menyimpan komponen: " + (errorData.message || JSON.stringify(errorData)));
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleDeleteComponent = async (id: number) => {
    const result = await MySwal.fire({
      title: 'Hapus komponen ini?',
      text: "Komponen yang dihapus tidak akan masuk lagi ke tagihan bulan depan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/billing-components/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success("Komponen berhasil dihapus!");
        fetchComponents();
      } else {
        toast.error("Gagal menghapus komponen.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleGenerate = async () => {
    const result = await MySwal.fire({
      title: `Generate Tagihan?`,
      html: `Anda akan mencetak tagihan massal untuk <b>Bulan ${generateMonth} Tahun ${generateYear}</b>.<br/>Proses ini tidak bisa dibatalkan secara massal.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Eksekusi Generate!',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    setIsGenerating(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:8000/api/billings/generate", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ month: generateMonth, year: generateYear })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || "Berhasil generate tagihan.");
        fetchBillings();
        setActiveTab("bills");
      } else {
        toast.error("Gagal: " + (data.message || "Terjadi kesalahan."));
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal terhubung ke server.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    // For file uploads in Laravel, usually we use POST and add _method=PUT if it's an update
    const url = paymentMethodForm.id 
      ? `http://localhost:8000/api/payment-methods/${paymentMethodForm.id}`
      : `http://localhost:8000/api/payment-methods`;

    const formDataObj = new FormData();
    formDataObj.append("bank_name", paymentMethodForm.bank_name);
    formDataObj.append("account_number", paymentMethodForm.account_number);
    formDataObj.append("account_name", paymentMethodForm.account_name);
    formDataObj.append("is_active", paymentMethodForm.is_active ? "1" : "0");
    
    if (paymentMethodForm.id) {
        formDataObj.append("_method", "PUT");
    }

    if (paymentMethodQr) {
        formDataObj.append("qr_image", paymentMethodQr);
    }

    try {
      const res = await fetch(url, {
        method: "POST", // always POST when sending FormData containing files
        headers: {
          "Accept": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: formDataObj
      });
      if (res.ok) {
        setShowPaymentMethodForm(false);
        setPaymentMethodForm({ id: "", bank_name: "", account_number: "", account_name: "", is_active: true });
        setPaymentMethodQr(null);
        fetchPaymentMethods();
        toast.success("Metode pembayaran berhasil disimpan!");
      } else {
        let errorData;
        try {
          errorData = await res.json();
        } catch (e) {
          const text = await res.text();
          console.error("Non-JSON response:", text);
          throw new Error("Server mengembalikan respons yang tidak valid (bukan JSON). " + text.substring(0, 50));
        }
        toast.error("Gagal menyimpan: " + (errorData.message || JSON.stringify(errorData)));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan jaringan.");
    }
  };

  const handleDeletePaymentMethod = async (id: number) => {
    const result = await MySwal.fire({
      title: 'Hapus metode pembayaran?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });
    if (!result.isConfirmed) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/payment-methods/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Metode pembayaran berhasil dihapus!");
        fetchPaymentMethods();
      } else {
        toast.error("Gagal menghapus.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleMultiPayUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofImage || selectedBillingIds.length === 0) {
      toast.error("Pilih minimal satu bulan dan unggah bukti transfer.");
      return;
    }

    const token = localStorage.getItem("token");
    const formDataObj = new FormData();
    formDataObj.append("proof_image", proofImage);
    selectedBillingIds.forEach((id, index) => {
      formDataObj.append(`billing_ids[${index}]`, id.toString());
    });

    try {
      const res = await fetch(`http://localhost:8000/api/billings/pay-multiple`, {
        method: "POST",
        headers: { 
          "Accept": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: formDataObj
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Bukti berhasil diunggah!");
        setShowMultiPayModal(false);
        setSelectedBillingIds([]);
        setProofImage(null);
        fetchBillings();
      } else {
        toast.error("Gagal: " + (data.message || JSON.stringify(data)));
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleMultiPayWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBillingIds.length === 0) {
      toast.error("Pilih minimal satu bulan untuk dibayar.");
      return;
    }

    // Calculate total
    const totalToPay = billings.filter(b => selectedBillingIds.includes(b.id)).reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0);

    if (userData.wallet_balance < totalToPay) {
      toast.error("Saldo Warga tidak mencukupi!");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/billings/pay-multiple-with-wallet`, {
        method: "POST",
        headers: { 
          "Accept": "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ billing_ids: selectedBillingIds })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Pembayaran multi-bulan berhasil menggunakan Saldo Warga!");
        const userRes = await fetch("http://localhost:8000/api/user", { headers: { Authorization: `Bearer ${token}` } });
        if(userRes.ok) setUserData(await userRes.json());
        
        setShowMultiPayModal(false);
        setSelectedBillingIds([]);
        fetchBillings();
      } else {
        toast.error("Gagal: " + (data.message || JSON.stringify(data)));
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleVerify = async (id: number, status: 'paid' | 'unpaid') => {
    const actionText = status === 'paid' ? 'Terima & Lunaskan' : 'Tolak Bukti Bayar';
    const confirmColor = status === 'paid' ? '#10b981' : '#ef4444';

    const result = await MySwal.fire({
      title: `${actionText}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      cancelButtonText: 'Batal',
      confirmButtonText: `Ya, ${actionText}`
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/billings/${id}/verify`, {
        method: "PUT",
        headers: { 
          "Accept": "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Verifikasi berhasil!");
        setShowVerifyModal(false);
        fetchBillings();
      } else {
        toast.error("Gagal verifikasi.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  if (!userData) return <div className="p-8 text-center text-slate-500">Memuat data...</div>;

  const isWarga = userData.role_id === 8;
  const isRW = [2, 4, 5].includes(userData.role_id);
  const isRT = [1, 3, 6, 7].includes(userData.role_id);
  const isSA = userData.role_id === 1;
  const formatRupiah = (angka: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);

  const availableYears = isWarga 
    ? Array.from(new Set(billings.map(b => b.year))).concat([new Date().getFullYear()]).sort((a, b) => b - a).filter((item, pos, self) => self.indexOf(item) === pos)
    : [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">Manajemen Keuangan & IPL</h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">Kelola komponen iuran dan pantau tagihan warga.</p>
          </div>
          {(isRW || isSA) && (
            <div>
              <select
                value={selectedRt}
                onChange={(e) => { setSelectedRt(e.target.value); setCurrentPage(1); }}
                className="p-2 border border-slate-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 font-medium text-slate-700 shadow-sm"
              >
                <option value="">Semua RT</option>
                {rts.map(rt => (
                  <option key={rt.id} value={rt.id}>{rt.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 space-x-6">
          {!isWarga && (
            <button
              onClick={() => setActiveTab("master")}
              className={`py-4 px-2 font-medium text-sm flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === "master" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span>Master Komponen</span>
            </button>
          )}
          {!isWarga && (
            <button
              onClick={() => setActiveTab("payment_methods")}
              className={`py-4 px-2 font-medium text-sm flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === "payment_methods" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <BanknotesIcon className="w-5 h-5" />
              <span>Metode Pembayaran</span>
            </button>
          )}
          {isRT && (
            <button
              onClick={() => setActiveTab("generate")}
              className={`py-4 px-2 font-medium text-sm flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === "generate" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <PlayIcon className="w-5 h-5" />
              <span>Generate Tagihan</span>
            </button>
          )}
          {!isRW && (
            <button
              onClick={() => setActiveTab("bills")}
              className={`py-4 px-2 font-medium text-sm flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === "bills" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <BanknotesIcon className="w-5 h-5" />
              <span>{isWarga ? "Tagihan Saya" : "Daftar Tagihan Warga"}</span>
              {meta.pending_count > 0 && !isWarga && (
                <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {meta.pending_count}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* TAB: MASTER KOMPONEN */}
          {activeTab === "master" && !isWarga && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800">Daftar Komponen IPL Aktif</h2>
                {isRT && (
                  <button
                    onClick={() => {
                      setFormData({ id: "", name: "", amount: "", is_active: true });
                      setShowComponentForm(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Tambah Komponen</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Nama Komponen</th>
                      <th className="px-6 py-4 font-semibold">Nominal</th>
                      <th className="px-6 py-4 font-semibold">Tingkat</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {components.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Belum ada komponen tagihan.</td>
                      </tr>
                    ) : components.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-800">{c.name}</td>
                        <td className="px-6 py-4 text-slate-600">{formatRupiah(c.amount)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-md ${c.level === 'RW' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                            {c.level}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-md ${c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {c.is_active ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isRT && !c.is_rw_mandated && c.level === 'RT' ? (
                            <>
                              <button onClick={() => { setFormData(c); setShowComponentForm(true); }} className="text-blue-600 hover:text-blue-800 p-1" title="Edit"><PencilSquareIcon className="w-5 h-5"/></button>
                              <button onClick={() => handleDeleteComponent(c.id)} className="text-red-600 hover:text-red-800 p-1 ml-2" title="Hapus"><TrashIcon className="w-5 h-5"/></button>
                            </>
                          ) : c.is_rw_mandated && isRT ? (
                             <span className="text-xs text-slate-400 italic">Mandat RW</span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: METODE PEMBAYARAN */}
          {activeTab === "payment_methods" && !isWarga && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800">Daftar Rekening / E-Wallet</h2>
                {isRT && (
                  <button
                    onClick={() => {
                      setPaymentMethodForm({ id: "", bank_name: "", account_number: "", account_name: "", is_active: true });
                      setShowPaymentMethodForm(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Tambah Rekening</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Nama Bank / E-Wallet</th>
                      {(isRW || isSA) && <th className="px-6 py-4 font-semibold">Asal (RT)</th>}
                      <th className="px-6 py-4 font-semibold">Nomor Rekening</th>
                      <th className="px-6 py-4 font-semibold">Atas Nama</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentMethods.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Belum ada metode pembayaran.</td>
                      </tr>
                    ) : paymentMethods.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-800">
                           {p.bank_name}
                           {p.qr_image_path && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">QRIS</span>}
                        </td>
                        {(isRW || isSA) && (
                           <td className="px-6 py-4 text-slate-700 font-medium">{p.rt?.name || "Global"}</td>
                        )}
                        <td className="px-6 py-4 font-mono text-slate-600">{p.account_number}</td>
                        <td className="px-6 py-4 text-slate-600">{p.account_name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-md ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {p.is_active ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isRT && (
                            <>
                              <button onClick={() => { setPaymentMethodForm(p); setShowPaymentMethodForm(true); }} className="text-blue-600 hover:text-blue-800 p-1"><PencilSquareIcon className="w-5 h-5"/></button>
                              <button onClick={() => handleDeletePaymentMethod(p.id)} className="text-red-600 hover:text-red-800 p-1 ml-2"><TrashIcon className="w-5 h-5"/></button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: GENERATE TAGIHAN */}
          {activeTab === "generate" && isRT && (
            <div className="max-w-2xl mx-auto py-8">
              <div className="bg-gradient-to-b from-blue-50 to-white p-8 rounded-2xl border border-blue-100 text-center shadow-sm">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DocumentCheckIcon className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Generate Tagihan Bulanan</h2>
                <p className="text-slate-600 mb-6 text-sm">
                  Proses ini akan mengumpulkan semua "Master Komponen IPL" (RW dan RT) dan mengirimkan tagihan ke masing-masing akun warga yang disetujui.
                </p>
                
                <div className="flex items-center justify-center space-x-4 mb-8">
                  <select 
                    value={generateMonth} 
                    onChange={e => setGenerateMonth(parseInt(e.target.value))}
                    className="p-3 border border-slate-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-slate-700"
                  >
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>Bulan {m}</option>
                    ))}
                  </select>
                  <select 
                    value={generateYear} 
                    onChange={e => setGenerateYear(parseInt(e.target.value))}
                    className="p-3 border border-slate-300 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-slate-700"
                  >
                    {[2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>Tahun {y}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200'}`}
                >
                  {isGenerating ? "Sedang Memproses..." : "Eksekusi Generate Tagihan"}
                </button>
              </div>
            </div>
          )}

          {/* TAB: TAGIHAN WARGA */}
          {activeTab === "bills" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
                <h2 className="text-lg font-semibold text-slate-800">
                  {isWarga ? "Riwayat Tagihan Anda" : "Daftar Tagihan Seluruh Warga"}
                </h2>
                {isWarga ? (
                  <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
                    <select
                      value={selectedWargaYear}
                      onChange={(e) => setSelectedWargaYear(parseInt(e.target.value))}
                      className="p-2 border border-slate-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 font-bold text-slate-700 shadow-sm"
                    >
                      {availableYears.map(y => (
                        <option key={y} value={y}>Tahun {y}</option>
                      ))}
                    </select>
                    {billings.some(b => b.status === 'unpaid' && b.year === selectedWargaYear) && (
                      <button 
                        onClick={() => setShowMultiPayModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-colors whitespace-nowrap flex-1 sm:flex-none text-center"
                      >
                        Bayar Tagihan
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedStatus}
                      onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                      className="px-4 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-slate-700 shadow-sm text-sm transition-colors"
                    >
                      <option value="">Semua Status</option>
                      <option value="unpaid">Belum Lunas</option>
                      <option value="pending_verification">Menunggu Verifikasi</option>
                      <option value="paid">Lunas</option>
                    </select>
                  </div>
                )}
              </div>
              
              {isWarga ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({length: 12}, (_, i) => i + 1).map(month => {
                    const b = billings.find(bill => bill.month === month && bill.year === selectedWargaYear);
                    if (b) {
                      return (
                        <div key={month} className={`border rounded-xl p-3 sm:p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow ${
                          b.status === 'paid' ? 'bg-emerald-50 border-emerald-200' :
                          b.status === 'pending_verification' ? 'bg-amber-50 border-amber-200' :
                          'bg-blue-50 border-blue-200'
                        }`}>
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-slate-800">Bulan {month}</h3>
                              <span className={`px-2 py-0.5 text-[9px] sm:text-[10px] font-bold rounded-full border ${
                                b.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                b.status === 'pending_verification' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {b.status === 'paid' ? 'LUNAS' : 
                                 b.status === 'pending_verification' ? 'MENUNGGU VERIFIKASI' : 
                                 'BELUM LUNAS'}
                              </span>
                            </div>
                            <p className="text-lg sm:text-xl font-bold text-slate-800 my-2 sm:my-4">{formatRupiah(b.total_amount)}</p>
                          </div>
                          {b.status !== 'unpaid' && (
                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                               <button onClick={() => { setSelectedBilling(b); setShowVerifyModal(true); }} className="w-full text-sm text-slate-600 bg-slate-100 font-bold hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors">Detail Pembayaran</button>
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <div key={month} className="border border-slate-200 rounded-xl p-3 sm:p-5 bg-slate-50 flex flex-col items-center justify-center text-slate-400 min-h-[120px] sm:min-h-[160px]">
                          <LockClosedIcon className="w-6 h-6 sm:w-8 sm:h-8 mb-2 text-slate-300" />
                          <h3 className="font-bold text-slate-500 text-sm sm:text-base">Bulan {month}</h3>
                          <p className="text-[10px] sm:text-xs mt-1 font-medium bg-slate-200 text-slate-500 px-2 py-1 rounded">Belum Tersedia</p>
                        </div>
                      );
                    }
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Periode</th>
                        <th className="px-6 py-4 font-semibold">Nama Warga</th>
                        <th className="px-6 py-4 font-semibold">Domisili</th>
                        <th className="px-6 py-4 font-semibold">Total Tagihan</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Rincian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isLoading ? (
                         <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Memuat data...</td></tr>
                      ) : billings.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Belum ada tagihan.</td></tr>
                      ) : billings.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-800">
                            Bulan {b.month} / {b.year}
                          </td>
                          <td className="px-6 py-4 text-slate-700 font-medium">
                            {b.user?.name}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {b.user?.rt?.name || "-"} / {b.user?.house?.block?.name || "-"} / No. {b.user?.house?.number || "-"}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            {formatRupiah(b.total_amount)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                              b.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                              b.status === 'pending_verification' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                              'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {b.status === 'paid' ? 'LUNAS' : 
                               b.status === 'pending_verification' ? 'MENUNGGU VERIFIKASI' : 
                               'BELUM LUNAS'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {b.status === 'pending_verification' && isRT && (
                              <button 
                                onClick={() => { setSelectedBilling(b); setShowVerifyModal(true); }}
                                className="text-sm bg-amber-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-amber-600 transition-colors"
                              >
                                Verifikasi
                              </button>
                            )}
                            {b.status === 'paid' && (
                               <button onClick={() => { setSelectedBilling(b); setShowVerifyModal(true); }} className="text-sm text-slate-500 font-medium hover:text-slate-700 ml-2">Detail</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {!isWarga && meta.last_page > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-slate-500 font-medium">
                    Halaman {meta.current_page} dari {meta.last_page} (Total {meta.total} Tagihan)
                  </p>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={meta.current_page === 1}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      Sebelumnya
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(meta.last_page, p + 1))}
                      disabled={meta.current_page === meta.last_page}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Form Komponen */}
      {showComponentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{formData.id ? "Edit Komponen" : "Tambah Komponen Baru"}</h3>
              <button onClick={() => setShowComponentForm(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSaveComponent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Komponen (Tujuan Iuran)</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Misal: Keamanan RW" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
                <input required type="number" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Misal: 25000" />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Komponen Aktif (Masuk Tagihan)</label>
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setShowComponentForm(false)} className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">Batal</button>
                <button type="submit" className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Form Payment Method */}
      {showPaymentMethodForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{paymentMethodForm.id ? "Edit Rekening" : "Tambah Rekening Baru"}</h3>
              <button onClick={() => setShowPaymentMethodForm(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSavePaymentMethod} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Bank / E-Wallet</label>
                <input required type="text" value={paymentMethodForm.bank_name} onChange={e => setPaymentMethodForm({...paymentMethodForm, bank_name: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Misal: BCA / DANA" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Rekening</label>
                <input required type="text" value={paymentMethodForm.account_number} onChange={e => setPaymentMethodForm({...paymentMethodForm, account_number: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Misal: 1234567890" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Atas Nama</label>
                <input required type="text" value={paymentMethodForm.account_name} onChange={e => setPaymentMethodForm({...paymentMethodForm, account_name: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Misal: Kas RW Erika" />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input type="checkbox" id="pm_is_active" checked={paymentMethodForm.is_active} onChange={e => setPaymentMethodForm({...paymentMethodForm, is_active: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <label htmlFor="pm_is_active" className="text-sm font-medium text-slate-700">Metode Aktif</label>
              </div>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Upload QR Code (Opsional)</label>
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) setPaymentMethodQr(e.target.files[0]);
                    }} 
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                  />
                  <p className="text-xs text-slate-500 mt-2">Gambar QRIS / QR rekening (Maks 5MB).</p>
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setShowPaymentMethodForm(false)} className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors">Batal</button>
                <button type="submit" className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Warga Multi-Pay */}
      {showMultiPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Pembayaran Tagihan IPL - Tahun {selectedWargaYear}</h3>
              <button onClick={() => { setShowMultiPayModal(false); setSelectedBillingIds([]); setProofImage(null); }} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex flex-col lg:flex-row gap-6">
              
              {/* Left Side: Month Checkboxes */}
              <div className="flex-1 space-y-4">
                <p className="text-sm font-bold text-slate-800">Pilih Bulan Pembayaran:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({length: 12}, (_, i) => i + 1).map(month => {
                    const b = billings.find(bill => bill.month === month && bill.year === selectedWargaYear);
                    if (!b) {
                      return (
                        <div key={month} className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex items-center gap-3 opacity-50 cursor-not-allowed">
                          <input type="checkbox" disabled className="w-5 h-5 rounded border-slate-300" />
                          <div>
                            <p className="text-sm font-bold text-slate-500">Bulan {month}</p>
                            <p className="text-[10px] text-slate-400">Belum Tersedia</p>
                          </div>
                        </div>
                      );
                    }

                    const isPaid = b.status !== 'unpaid';
                    const isSelected = selectedBillingIds.includes(b.id);
                    
                    return (
                      <div 
                        key={month} 
                        className={`border rounded-lg p-3 flex items-center gap-3 transition-colors ${
                          isPaid ? 'bg-slate-100 border-slate-200 cursor-not-allowed' : 
                          isSelected ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (isPaid) return;
                          if (isSelected) {
                            setSelectedBillingIds(prev => prev.filter(id => id !== b.id));
                          } else {
                            setSelectedBillingIds(prev => [...prev, b.id]);
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={isPaid || isSelected} 
                          disabled={isPaid}
                          onChange={() => {}} // Handled by parent div onClick
                          className={`w-5 h-5 rounded ${isPaid ? 'text-slate-400 border-slate-300' : 'text-blue-600 border-slate-300'}`}
                        />
                        <div>
                          <p className={`text-sm font-bold ${isPaid ? 'text-slate-500' : 'text-slate-800'}`}>Bulan {month}</p>
                          <p className={`text-[10px] font-bold ${isPaid ? (b.status === 'paid' ? 'text-emerald-600' : 'text-amber-600') : 'text-slate-500'}`}>
                            {isPaid ? (b.status === 'paid' ? 'LUNAS' : 'MENUNGGU VERIFIKASI') : formatRupiah(b.total_amount)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Side: Payment Form */}
              <div className="lg:w-[350px] flex flex-col space-y-6">
                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100">
                  <p className="text-sm font-medium mb-1">Total Dibayar ({selectedBillingIds.length} Bulan):</p>
                  <p className="text-2xl font-bold">
                    {formatRupiah(
                      billings.filter(b => selectedBillingIds.includes(b.id)).reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0)
                    )}
                  </p>
                </div>
                
                <div className="flex-1 space-y-6">
                  {/* Upload Form */}
                  <form onSubmit={handleMultiPayUpload} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                    <p className="text-sm font-bold text-slate-800 mb-3">Opsi 1: Transfer Bank</p>
                    <div className="mb-4">
                       <label className="block text-xs font-semibold text-slate-600 mb-1">Transfer ke:</label>
                       {paymentMethods.filter(p => p.is_active).length > 0 ? (
                         <select className="w-full text-sm p-2 border border-slate-300 rounded-lg bg-slate-50">
                           {paymentMethods.filter(p => p.is_active).map(p => (
                             <option key={p.id}>{p.bank_name} - {p.account_number} ({p.account_name})</option>
                           ))}
                         </select>
                       ) : (
                         <p className="text-xs text-red-600 italic">Belum ada metode pembayaran.</p>
                       )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Upload Bukti Transfer</label>
                      <input 
                        required 
                        type="file" 
                        accept="image/*"
                        onChange={e => {
                          if (e.target.files && e.target.files.length > 0) setProofImage(e.target.files[0]);
                        }} 
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                      />
                    </div>
                    <button type="submit" disabled={!proofImage || selectedBillingIds.length === 0} className={`mt-4 w-full py-2.5 px-4 rounded-lg text-white font-bold transition-colors shadow-sm text-sm ${proofImage && selectedBillingIds.length > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}`}>Kirim Bukti</button>
                  </form>
                  
                  <div className="relative flex items-center py-1">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold">ATAU</span>
                      <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  {/* Wallet Form */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm">
                    <p className="text-sm font-bold text-slate-800 mb-2">Opsi 2: Saldo Warga</p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-slate-600 text-xs">Saldo Anda:</span>
                      <span className="font-bold text-blue-700 text-sm">{formatRupiah(userData?.wallet_balance || 0)}</span>
                    </div>
                    <button 
                      onClick={handleMultiPayWallet}
                      disabled={selectedBillingIds.length === 0 || userData?.wallet_balance < billings.filter(b => selectedBillingIds.includes(b.id)).reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0)}
                      className={`w-full py-2.5 px-4 rounded-lg text-white font-bold transition-colors shadow-sm text-sm ${selectedBillingIds.length > 0 && userData?.wallet_balance >= billings.filter(b => selectedBillingIds.includes(b.id)).reduce((acc, curr) => acc + parseFloat(curr.total_amount), 0) ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-not-allowed'}`}
                    >
                      Bayar via Saldo
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal Warga Upload Bukti */}
      {showUploadModal && selectedBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Pembayaran IPL Bulan {selectedBilling.month} / {selectedBilling.year}</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100">
                <p className="text-sm font-medium mb-1">Total Tagihan:</p>
                <p className="text-2xl font-bold">{formatRupiah(selectedBilling.total_amount)}</p>
              </div>
              
              <div>
                <p className="text-sm font-bold text-slate-800 mb-3">Silakan transfer ke salah satu rekening berikut:</p>
                <div className="space-y-4">
                  {paymentMethods.filter(p => p.is_active).map(p => (
                    <div key={p.id} className="p-4 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-sm">
                      <div className="flex-1">
                        <p className="font-bold text-lg text-slate-800 mb-1">{p.bank_name}</p>
                        <p className="font-mono text-xl text-slate-600 bg-slate-50 p-2 rounded-lg inline-block tracking-wider border border-slate-100">{p.account_number}</p>
                        <p className="text-sm text-slate-500 uppercase tracking-widest mt-2">Atas Nama</p>
                        <p className="text-base font-bold text-slate-700">{p.account_name}</p>
                      </div>
                      {p.qr_image_path && (
                         <div className="w-full md:w-32 h-32 flex-shrink-0 bg-slate-50 rounded-xl border border-slate-200 p-2 flex items-center justify-center">
                            <img src={`http://localhost:8000/storage/${p.qr_image_path}`} alt={`QR ${p.bank_name}`} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                         </div>
                      )}
                    </div>
                  ))}
                  {paymentMethods.length === 0 && (
                    <p className="text-sm text-red-600 italic">Belum ada metode pembayaran yang diatur RW.</p>
                  )}
                </div>
              </div>

              <form onSubmit={handleUploadProof} className="space-y-4 border-t pt-6">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Upload Bukti Transfer</label>
                  <input 
                    required 
                    type="file" 
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        setProofImage(e.target.files[0]);
                      }
                    }} 
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                  />
                  <p className="text-xs text-slate-500 mt-2">Format didukung: JPG, PNG. Maks: 5MB.</p>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors">Batal</button>
                  <button type="submit" disabled={!proofImage} className={`flex-1 py-3 px-4 rounded-xl text-white font-bold transition-colors shadow-sm ${proofImage ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}`}>Kirim Bukti Transfer</button>
                </div>
              </form>
              
              <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">ATAU</span>
                  <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-sm font-bold text-slate-800 mb-2">Gunakan Saldo Warga</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-600 text-sm">Saldo Anda saat ini:</span>
                  <span className="font-bold text-blue-700">{formatRupiah(userData?.wallet_balance || 0)}</span>
                </div>
                <button 
                  onClick={handlePayWithWallet}
                  disabled={userData?.wallet_balance < selectedBilling.total_amount}
                  className={`w-full py-3 px-4 rounded-xl text-white font-bold transition-colors shadow-sm ${userData?.wallet_balance >= selectedBilling.total_amount ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-not-allowed'}`}
                >
                  {userData?.wallet_balance >= selectedBilling.total_amount ? 'Bayar via Potong Saldo' : 'Saldo Tidak Mencukupi'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal Pengurus Verifikasi */}
      {showVerifyModal && selectedBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{selectedBilling.status === 'paid' ? 'Detail Pembayaran' : 'Verifikasi Pembayaran'}</h3>
              <button onClick={() => setShowVerifyModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-6 space-y-6 text-center">
              <div>
                <p className="text-sm text-slate-500">Warga</p>
                <p className="font-bold text-slate-800">{selectedBilling.user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">Bukti Transfer:</p>
                {selectedBilling.proof_image_path ? (
                   <img src={`http://localhost:8000/storage/${selectedBilling.proof_image_path}`} alt="Bukti" className="max-w-full h-64 object-contain mx-auto rounded-xl border border-slate-200 bg-slate-50" />
                ) : (
                   <div className="h-40 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">Tidak ada gambar</div>
                )}
              </div>
              <p className="font-medium text-slate-800">Sejumlah: {formatRupiah(selectedBilling.total_amount)}</p>
              {!isWarga && selectedBilling.status === 'pending_verification' && (
                <div className="flex space-x-3 pt-4">
                  <button onClick={() => handleVerify(selectedBilling.id, 'unpaid')} className="flex-1 py-3 px-4 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 font-bold transition-colors">Tolak</button>
                  <button onClick={() => handleVerify(selectedBilling.id, 'paid')} className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold transition-colors shadow-sm">Terima (Lunas)</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
