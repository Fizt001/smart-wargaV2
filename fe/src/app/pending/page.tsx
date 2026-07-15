"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckBadgeIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

export default function PendingPage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="w-full max-w-lg bg-white p-8 sm:p-12 rounded-[2rem] shadow-2xl border border-slate-100 z-10 my-8 mx-4 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <CheckBadgeIcon className="w-10 h-10 text-amber-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-4">Menunggu Persetujuan RT</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Akun Anda telah berhasil dibuat. Demi keamanan dan keabsahan data warga, akun Anda sedang dalam tahap verifikasi oleh Ketua RT setempat. 
          <br /><br />
          Anda akan dapat mengakses layanan SIP-BTR setelah disetujui.
        </p>

        <button
          onClick={handleLogout}
          className="inline-flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-xl transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Kembali ke Halaman Login</span>
        </button>
      </div>
    </div>
  );
}
