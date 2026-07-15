"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { UserCircleIcon, KeyIcon, DevicePhoneMobileIcon, HomeModernIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

export default function PengaturanPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone_number: "",
    house_number: "",
  });

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const token = localStorage.getItem("token");
        
        const res = await fetch(`${apiUrl}/api/user`, {
          headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
        });
        const data = await res.json();
        
        setUser(data);
        setProfileData({
          name: data.name || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          house_number: data.house_number || "",
        });
      } catch (error) {
        toast.error("Gagal mengambil data profil");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const submitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${apiUrl}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(profileData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Terjadi kesalahan saat menyimpan profil");

      toast.success(data.message);
      setUser(data.data); // Update local user state
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.password !== passwordData.password_confirmation) {
      toast.error("Konfirmasi password baru tidak cocok");
      return;
    }

    setIsSavingPassword(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${apiUrl}/api/user/password`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(passwordData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Terjadi kesalahan saat mengubah password");

      toast.success(data.message);
      // Reset form on success
      setPasswordData({ current_password: "", password: "", password_confirmation: "" });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-10 text-slate-500">Memuat pengaturan...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pengaturan Akun</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola preferensi dan keamanan akun Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
            <UserCircleIcon className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-slate-800 text-lg">Informasi Profil</h3>
          </div>
          <form onSubmit={submitProfile} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircleIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={profileData.name}
                    onChange={handleProfileChange}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor HP / WhatsApp</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DevicePhoneMobileIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="phone_number"
                    value={profileData.phone_number}
                    onChange={handleProfileChange}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="0812..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Blok / Nomor Rumah</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HomeModernIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="house_number"
                    value={profileData.house_number}
                    onChange={handleProfileChange}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="E1/10"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-70 shadow-lg shadow-blue-500/30"
              >
                {isSavingProfile ? "Menyimpan..." : "Simpan Profil"}
              </button>
            </div>
          </form>
        </div>

        {/* Security Card */}
        <div className="md:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
            <KeyIcon className="w-6 h-6 text-emerald-600" />
            <h3 className="font-semibold text-slate-800 text-lg">Ubah Sandi</h3>
          </div>
          <form onSubmit={submitPassword} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password Saat Ini</label>
              <input
                type="password"
                name="current_password"
                required
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            
            <hr className="border-slate-100 my-2" />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password Baru</label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                value={passwordData.password}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password Baru</label>
              <input
                type="password"
                name="password_confirmation"
                required
                minLength={8}
                value={passwordData.password_confirmation}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSavingPassword}
                className="w-full px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-70 shadow-lg shadow-emerald-500/30"
              >
                {isSavingPassword ? "Memproses..." : "Ganti Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
