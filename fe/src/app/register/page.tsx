"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { UserCircleIcon, IdentificationIcon, HomeModernIcon, MapPinIcon, PhoneIcon, EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nik: "",
    name: "",
    phone_number: "",
    email: "",
    password: "",
    rt_id: "",
    block_id: "",
    house_id: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  // Master Data States
  const [rts, setRts] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchRts();
  }, []);

  const fetchRts = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/public/rts`);
      const data = await res.json();
      if (data.status === 'success') setRts(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBlocks = async (rtId: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/public/blocks/${rtId}`);
      const data = await res.json();
      if (data.status === 'success') setBlocks(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHouses = async (blockId: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/public/houses/${blockId}`);
      const data = await res.json();
      if (data.status === 'success') setHouses(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Chain dependent dropdowns
    if (name === "rt_id") {
      setFormData(prev => ({ ...prev, block_id: "", house_id: "" }));
      setBlocks([]);
      setHouses([]);
      if (value) fetchBlocks(value);
    }
    if (name === "block_id") {
      setFormData(prev => ({ ...prev, house_id: "" }));
      setHouses([]);
      if (value) fetchHouses(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Pendaftaran gagal");
      }

      toast.success(data.message || "Pendaftaran berhasil! Silakan tunggu persetujuan RT.");
      
      router.push("/login");

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-2xl bg-white p-8 sm:p-12 rounded-[2rem] shadow-2xl border border-slate-100 z-10 my-8 mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-6 shadow-xl shadow-blue-500/30 flex items-center justify-center transform -rotate-6">
            <HomeModernIcon className="w-8 h-8 text-white transform rotate-6" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Pendaftaran Warga</h1>
          <p className="text-slate-500 mt-2">Lengkapi data diri dan domisili Anda untuk bergabung.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kiri: Identitas Pribadi */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Identitas</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NIK (16 Digit)</label>
                <div className="relative">
                  <IdentificationIcon className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="nik"
                    required
                    maxLength={16}
                    value={formData.nik}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Masukkan 16 digit NIK"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <div className="relative">
                  <UserCircleIcon className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Nama sesuai KTP"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor WhatsApp</label>
                <div className="relative">
                  <PhoneIcon className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="phone_number"
                    required
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Contoh: 0812..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Aktif</label>
                <div className="relative">
                  <EnvelopeIcon className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="email@anda.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password Baru</label>
                <div className="relative">
                  <LockClosedIcon className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              </div>
            </div>

            {/* Kanan: Domisili */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Domisili Rumah</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih RT</label>
                <div className="relative">
                  <MapPinIcon className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    name="rt_id"
                    required
                    value={formData.rt_id}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="">-- Pilih RT --</option>
                    {rts.map(rt => (
                      <option key={rt.id} value={rt.id}>{rt.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Blok</label>
                <div className="relative">
                  <MapPinIcon className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    name="block_id"
                    required
                    disabled={!formData.rt_id || blocks.length === 0}
                    value={formData.block_id}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none disabled:opacity-50"
                  >
                    <option value="">-- Pilih Blok --</option>
                    {blocks.map(block => (
                      <option key={block.id} value={block.id}>{block.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Nomor Rumah</label>
                <div className="relative">
                  <HomeModernIcon className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    name="house_id"
                    required
                    disabled={!formData.block_id || houses.length === 0}
                    value={formData.house_id}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none disabled:opacity-50"
                  >
                    <option value="">-- Pilih Nomor --</option>
                    {houses.map(house => (
                      <option key={house.id} value={house.id}>
                        {house.number} {house.users_count > 0 ? '(Sudah Ada Penghuni)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-slate-500 mt-1">Anda dapat memilih rumah yang sudah ada penghuninya jika Anda bagian dari keluarga tersebut.</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 mt-6 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isLoading ? "Memproses Data..." : "Daftar Sebagai Warga"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-8">
          Sudah terdaftar? <Link href="/login" className="text-blue-600 font-semibold hover:underline">Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}
