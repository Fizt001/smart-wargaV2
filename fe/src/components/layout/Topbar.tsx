"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Bars3Icon, 
  BellIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";

export default function Topbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      await fetch(`${apiUrl}/api/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast.success("Berhasil keluar");
      router.push("/login");
    } catch (error) {
      toast.error("Gagal logout");
    }
  };

  const isWarga = user?.role_id === 8;

  return (
    <header className="h-14 sm:h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 shadow-sm flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center">
        {!isWarga && (
          <button className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <Bars3Icon className="w-6 h-6" />
          </button>
        )}
        <h2 className={`text-lg sm:text-xl font-bold text-slate-800 ${!isWarga ? 'ml-2 hidden sm:block' : ''}`}>
          {isWarga ? 'SIP-BTR' : 'Dashboard'}
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative">
          <BellIcon className="w-6 h-6" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>

        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-3 p-1.5 hover:bg-slate-50 rounded-full transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-slate-700 leading-tight">{user?.name || "Memuat..."}</p>
              <p className="text-xs text-slate-500">{user?.role?.name || "Admin"}</p>
            </div>
            <ChevronDownIcon className="w-4 h-4 text-slate-400 hidden md:block" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
              >
                Keluar Aplikasi
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
