"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  UsersIcon, 
  BanknotesIcon, 
  Squares2X2Icon,
  CalendarDaysIcon,
  MegaphoneIcon,
  XMarkIcon,
  ShieldCheckIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
  HomeModernIcon,
  ScaleIcon,
  TrashIcon,
  BriefcaseIcon,
  HomeIcon,
  WalletIcon
} from "@heroicons/react/24/outline";

export default function BottomNavWarga() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "Profil", href: "/dashboard/keluarga", icon: UsersIcon },
    { name: "Tagihan", href: "/dashboard/ipl", icon: BanknotesIcon },
    { name: "Menu", action: () => setIsMenuOpen(true), icon: Squares2X2Icon, isMain: true },
    { name: "Kegiatan", href: "/dashboard/kegiatan", icon: CalendarDaysIcon },
    { name: "Layanan", href: "/dashboard/pengaduan", icon: MegaphoneIcon },
  ];

  const allMenus = [
    { name: "Beranda", href: "/dashboard", icon: HomeIcon },
    { name: "Profil", href: "/dashboard/keluarga", icon: UsersIcon },
    { name: "Tagihan", href: "/dashboard/ipl", icon: BanknotesIcon },
    { name: "Saldo", href: "/dashboard/saldo", icon: WalletIcon },
    { name: "Agenda", href: "/dashboard/kegiatan", icon: CalendarDaysIcon },
    { name: "Informasi", href: "/dashboard/informasi", icon: MegaphoneIcon },
    { name: "Surat", href: "/dashboard/surat", icon: DocumentTextIcon },
    { name: "Pengaduan", href: "/dashboard/pengaduan", icon: MegaphoneIcon },
    { name: "Keamanan", href: "/dashboard/keamanan", icon: ShieldCheckIcon },
    { name: "Posyandu", href: "/dashboard/kesehatan", icon: ScaleIcon },
    { name: "Kematian", href: "/dashboard/kematian", icon: HomeModernIcon },
    { name: "Sampah", href: "/dashboard/banksampah", icon: TrashIcon },
    { name: "Fasilitas", href: "/dashboard/aset", icon: BuildingStorefrontIcon },
    { name: "UMKM", href: "/dashboard/umkm", icon: ShoppingBagIcon },
    { name: "Koperasi", href: "/dashboard/koperasi", icon: BriefcaseIcon },
  ];

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 z-40 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = item.href ? (item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)) : false;
            
            if (item.isMain) {
              return (
                <button 
                  key={idx} 
                  onClick={item.action}
                  className="flex flex-col items-center justify-center -mt-6 bg-emerald-600 rounded-full w-14 h-14 shadow-lg shadow-emerald-500/40 text-white hover:bg-emerald-700 transition-transform active:scale-95 z-50 border-4 border-slate-50"
                >
                  <Icon className="w-6 h-6" />
                </button>
              );
            }
            
            return (
              <Link 
                key={idx} 
                href={item.href!}
                className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-2' : ''}`} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Sheet Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] flex flex-col relative z-10 animate-in slide-in-from-bottom-full duration-300">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-3xl sticky top-0 z-20">
              <h2 className="text-lg font-bold text-slate-800">Semua Layanan</h2>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto pb-8">
              <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                {allMenus.map((menu, idx) => {
                  const Icon = menu.icon;
                  return (
                    <Link 
                      key={idx} 
                      href={menu.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex flex-col items-center text-center group"
                    >
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-2 group-active:bg-emerald-100 transition-colors">
                        <Icon className="w-6 h-6 stroke-2" />
                      </div>
                      <span className="text-[10px] font-medium text-slate-600 leading-tight">{menu.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
