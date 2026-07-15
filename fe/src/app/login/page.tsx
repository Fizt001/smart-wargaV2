"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  UsersIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  DocumentTextIcon,
  HeartIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const [appConfig, setAppConfig] = useState<any>(null);
  const router = useRouter();

  const features = [
    {
      title: "Data Warga Real-time",
      desc: "Integrasi data kependudukan tingkat RT dan RW yang mutakhir.",
      icon: UsersIcon,
      color: "text-blue-400",
      bg: "bg-blue-500/20",
      bannerGrad: "from-blue-600 to-indigo-800"
    },
    {
      title: "Keuangan Transparan",
      desc: "Pantau kas lingkungan, pembayaran IPL, dan laporan secara terbuka.",
      icon: BanknotesIcon,
      color: "text-emerald-400",
      bg: "bg-emerald-500/20",
      bannerGrad: "from-emerald-600 to-teal-800"
    },
    {
      title: "Keamanan & Pengaduan",
      desc: "Sistem pelaporan masalah lingkungan dan pemantauan Siskamling.",
      icon: ShieldCheckIcon,
      color: "text-red-400",
      bg: "bg-red-500/20",
      bannerGrad: "from-red-600 to-rose-800"
    },
    {
      title: "Layanan Persuratan",
      desc: "Kemudahan mengajukan surat pengantar RT/RW secara mandiri.",
      icon: DocumentTextIcon,
      color: "text-amber-400",
      bg: "bg-amber-500/20",
      bannerGrad: "from-amber-600 to-orange-800"
    },
    {
      title: "UMKM Warga",
      desc: "Wadah promosi dan jual-beli untuk memajukan ekonomi lingkungan.",
      icon: ShoppingBagIcon,
      color: "text-purple-400",
      bg: "bg-purple-500/20",
      bannerGrad: "from-purple-600 to-fuchsia-800"
    },
    {
      title: "Kesehatan & Lingkungan",
      desc: "Jadwal Posyandu dan pengelolaan limbah untuk lingkungan hijau.",
      icon: HeartIcon,
      color: "text-pink-400",
      bg: "bg-pink-500/20",
      bannerGrad: "from-pink-600 to-rose-800"
    },
  ];

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/public/app-config`);
        if (res.ok) {
          const data = await res.json();
          setAppConfig(data.data);
          document.title = `${data.data.app_name || 'SIP-BTR'} - ${data.data.rw_name || 'Portal Warga'}`;
        }
      } catch (err) {
        console.error("Failed to fetch app config", err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [features.length]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Login berhasil!");
        // Save token to localStorage for now
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));

        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        toast.error(data.message || "Email atau password salah.");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan pada server. Coba lagi nanti.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-900 relative overflow-hidden font-sans">

      {/* Dynamic Unified Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>

      {/* LEFT SIDE - INFORMATION/LANDING */}
      <div className="hidden lg:flex lg:w-7/12 relative flex-col justify-between overflow-hidden">
        {/* Content */}
        <div className="relative z-10 px-12 xl:px-16 py-12 xl:py-16 flex-1 flex flex-col justify-center">

          {/* Header Title */}
          <div className="mb-6 xl:mb-8">
            <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight leading-[1.15] mb-3">
              Portal Warga <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{appConfig?.rw_name || 'Perumahan BTR'}</span>
            </h1>
            <p className="text-slate-400 text-base xl:text-lg max-w-xl leading-relaxed">
              {appConfig?.app_description || 'Platform digital pintar untuk tata kelola lingkungan, transparansi, dan kolaborasi warga.'}
            </p>
          </div>

          {/* DYNAMIC BANNER */}
          <div className={`w-full max-w-2xl h-56 xl:h-64 rounded-3xl mb-6 xl:mb-8 relative overflow-hidden transition-all duration-700 shadow-2xl bg-gradient-to-br ${features[activeBanner].bannerGrad}`}>
            {/* Pattern overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

            {/* Tag / Badge */}
            <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-white/90 border border-white/10">
              Banner Kegiatan (Placeholder)
            </div>

            {/* Banner Content */}
            <div className="absolute bottom-0 left-0 p-6 xl:p-8 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <h2 className="text-2xl xl:text-3xl font-bold text-white mb-2 transform transition-all duration-500 translate-y-0">
                {features[activeBanner].title}
              </h2>
              <p className="text-slate-200 text-sm xl:text-base max-w-lg">
                {features[activeBanner].desc}
              </p>
            </div>
          </div>

          {/* FEATURE NAVIGATION (Clickable) */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-w-2xl">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              const isActive = idx === activeBanner;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveBanner(idx)}
                  className={`flex items-center p-3 rounded-2xl transition-all duration-300 text-left border ${isActive ? 'bg-white/10 border-white/20 scale-[1.02] shadow-lg' : 'hover:bg-white/5 border-transparent'} group`}
                >
                  <div className={`w-10 h-10 rounded-xl ${feat.bg} flex items-center justify-center flex-shrink-0 mr-3 transition-transform ${isActive ? 'scale-110' : ''}`}>
                    <Icon className={`w-5 h-5 ${feat.color}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{feat.title}</h3>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Footer info inside Left Side */}
        <div className="relative z-10 px-12 xl:px-16 pb-10">
          <p className="text-slate-500 text-xs xl:text-sm">
            &copy; {new Date().getFullYear()} Pengurus {appConfig?.rw_name || 'Lingkungan BTR'}. Semua hak cipta dilindungi.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="w-full lg:w-5/12 flex flex-col justify-center items-center px-4 sm:px-6 relative z-10">

        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">{appConfig?.app_name || 'SIP-BTR'}</h1>
          <p className="text-slate-400 mt-2">Portal Warga {appConfig?.rw_name || 'Perumahan BTR'}</p>
        </div>

        {/* Dialog-like Card */}
        <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-2xl p-8 sm:p-10 relative overflow-hidden">

          {/* Subtle decoration inside card */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10"></div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Masuk</h2>
            <p className="text-sm text-slate-500">Silakan masuk menggunakan akun Anda.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email atau NIK</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                placeholder="Misal: admin@sip.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
              </div>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-500 transition-colors">Lupa sandi?</a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-blue-600 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 mt-6 disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center group"
            >
              <span>{isLoading ? "Memproses..." : "Masuk"}</span>
              {!isLoading && <ArrowRightIcon className="w-5 h-5 ml-2 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm mb-3">Belum memiliki akun warga?</p>
            <Link href="/register" className="inline-flex justify-center items-center w-full px-4 py-3 border border-slate-200 text-sm text-slate-700 font-semibold rounded-xl hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300">
              Registrasi Warga Baru
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
