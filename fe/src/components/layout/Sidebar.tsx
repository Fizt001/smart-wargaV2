"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  BanknotesIcon,
  Cog6ToothIcon,
  MapIcon,
  ShieldCheckIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  BriefcaseIcon,
  ArchiveBoxIcon,
  WalletIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  ScaleIcon,
  TrashIcon,
  HomeModernIcon,
  ServerIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";

import { useState, useEffect } from "react";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
  show: boolean;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  standalone?: boolean; // if true, renders as a single link, not a group
  href?: string; // only for standalone
  items?: MenuItem[];
  show?: boolean; // computed from items
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdminOrRW, setIsSuperAdminOrRW] = useState(false);
  const [isSekretaris, setIsSekretaris] = useState(false);
  const [isApproved, setIsApproved] = useState(true);
  const [appName, setAppName] = useState("SIP-BTR");
  const [userRole, setUserRole] = useState<number | null>(null);
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const token = localStorage.getItem("token");
        
        if (token) {
          const res = await fetch(`${apiUrl}/api/user`, {
            headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
          });
          const data = await res.json();
          const user = data.data || data;
          if (user) {
            setIsApproved(user.registration_status === 'approved' || user.is_approved === true || user.is_approved === 1);
            if (user.role_id) setUserRole(user.role_id);
            if (user.role_id && user.role_id < 8) setIsAdmin(true);
            if (user.role_id && (user.role_id == 1 || user.role_id == 2)) setIsSuperAdminOrRW(true);
            if (user.role_id && (user.role_id == 1 || user.role_id == 4 || user.role_id == 6)) setIsSekretaris(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user role");
      }
    };
    
    const fetchConfig = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/public/app-config`);
        if (res.ok) {
          const data = await res.json();
          if (data.data.app_name) setAppName(data.data.app_name);
        }
      } catch (err) {
        console.error("Failed to fetch app config", err);
      }
    };

    fetchUser();
    fetchConfig();
  }, []);

  const menuGroups: MenuGroup[] = [
    {
      id: "beranda",
      label: "Beranda",
      icon: HomeIcon,
      standalone: true,
      href: "/dashboard",
      show: isApproved,
    },
    {
      id: "kependudukan",
      label: "Profil & Kependudukan",
      icon: UsersIcon,
      items: [
        { name: "Data Wilayah", href: "/dashboard/wilayah", icon: MapIcon, show: isApproved && isSuperAdminOrRW },
        { name: userRole === 1 ? "Data Pengurus" : "Data Warga", href: "/dashboard/warga", icon: UsersIcon, show: isApproved && isAdmin },
        { name: "Profil Keluarga", href: "/dashboard/keluarga", icon: UsersIcon, show: true },
      ],
    },
    {
      id: "keuangan",
      label: "Keuangan & Iuran",
      icon: WalletIcon,
      items: [
        { name: "IPL Warga", href: "/dashboard/ipl", icon: BanknotesIcon, show: isApproved },
        { name: "Saldo Warga", href: "/dashboard/saldo", icon: WalletIcon, show: isApproved },
        { name: "Keuangan & Kas", href: "/dashboard/keuangan", icon: WalletIcon, show: isApproved && isAdmin },
        { name: "Setoran ke RW", href: "/dashboard/setoran-rw", icon: BanknotesIcon, show: isApproved && isAdmin },
        { name: "Pengeluaran Rutin", href: "/dashboard/pengeluaran-rutin", icon: BanknotesIcon, show: isApproved && isAdmin },
      ],
    },
    {
      id: "agenda",
      label: "Agenda Kegiatan",
      icon: CalendarDaysIcon,
      items: [
        { name: "Kegiatan", href: "/dashboard/kegiatan", icon: CalendarDaysIcon, show: isApproved },
        { name: "Informasi", href: "/dashboard/informasi", icon: MegaphoneIcon, show: isApproved },
      ],
    },
    {
      id: "layanan",
      label: "Layanan Warga",
      icon: DocumentTextIcon,
      items: [
        { name: "Surat Pengantar", href: "/dashboard/surat", icon: DocumentTextIcon, show: isApproved },
        { name: "Arsip Surat", href: "/dashboard/arsip", icon: ArchiveBoxIcon, show: isApproved && isSekretaris },
        { name: "Pengaduan Warga", href: "/dashboard/pengaduan", icon: MegaphoneIcon, show: isApproved },
      ],
    },
    {
      id: "fasilitas",
      label: "Fasilitas & Program",
      icon: BuildingStorefrontIcon,
      items: [
        { name: "Keamanan (Ronda)", href: "/dashboard/keamanan", icon: ShieldCheckIcon, show: isApproved },
        { name: "Posyandu & Kesehatan", href: "/dashboard/kesehatan", icon: ScaleIcon, show: isApproved },
        { name: "Rukun Kematian", href: "/dashboard/kematian", icon: HomeModernIcon, show: isApproved },
        { name: "Bank Sampah", href: "/dashboard/banksampah", icon: TrashIcon, show: isApproved },
        { name: "Aset & Fasilitas RT", href: "/dashboard/aset", icon: BuildingStorefrontIcon, show: isApproved },
      ],
    },
    {
      id: "ekonomi",
      label: "Ekonomi Warga",
      icon: ShoppingBagIcon,
      items: [
        { name: "UMKM Warga", href: "/dashboard/umkm", icon: ShoppingBagIcon, show: isApproved },
        { name: "Koperasi RW", href: "/dashboard/koperasi", icon: BriefcaseIcon, show: isApproved },
      ],
    },
    {
      id: "master",
      label: "Master Database",
      icon: ServerIcon,
      items: [
        { name: "Data Agama", href: "/dashboard/master-database/agama", icon: ServerIcon, show: isApproved && isSuperAdminOrRW },
        { name: "Status Hubungan", href: "/dashboard/master-database/status-hubungan", icon: ServerIcon, show: isApproved && isSuperAdminOrRW },
        { name: "Jenis Surat", href: "/dashboard/master-database/surat", icon: DocumentTextIcon, show: isApproved && isSuperAdminOrRW },
        { name: "Status Perkawinan", href: "/dashboard/master-database/perkawinan", icon: ServerIcon, show: isApproved && isSuperAdminOrRW },
        { name: "Kategori Profesi", href: "/dashboard/master-database/profesi", icon: BriefcaseIcon, show: isApproved && isSuperAdminOrRW },
      ],
    },
    {
      id: "pengaturan",
      label: "Pengaturan",
      icon: Cog6ToothIcon,
      standalone: true,
      href: "/dashboard/settings",
      show: isApproved && isSuperAdminOrRW,
    },
  ];

  // Auto-open the group that contains the current active route
  useEffect(() => {
    const activeGroup = menuGroups.find(group =>
      !group.standalone && group.items?.some(item => pathname.startsWith(item.href))
    );
    if (activeGroup && !openGroups.includes(activeGroup.id)) {
      setOpenGroups(prev => [...prev, activeGroup.id]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleGroup = (id: string) => {
    setOpenGroups(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const isGroupActive = (group: MenuGroup) => {
    if (group.standalone && group.href) {
      return group.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(group.href);
    }
    return group.items?.some(item => pathname.startsWith(item.href)) ?? false;
  };

  const isWarga = userRole === 8;
  const sidebarClasses = `w-20 hover:w-64 bg-white text-slate-600 flex-col h-screen sticky top-0 border-r border-slate-200 shadow-xl z-20 transition-all duration-300 ease-in-out group overflow-x-hidden ${isWarga ? 'hidden md:flex' : 'flex'}`;

  return (
    <aside className={sidebarClasses}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-center group-hover:justify-start group-hover:px-6 px-0 border-b border-slate-200 bg-white/90 backdrop-blur transition-all duration-300 flex-shrink-0">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:hidden shadow-lg shadow-emerald-600/20">
          <span className="font-bold text-white text-lg">S</span>
        </div>
        <h1 className="text-xl font-bold text-slate-800 tracking-wide hidden group-hover:block transition-all whitespace-nowrap">
          {appName.substring(0, 4)}<span className="text-emerald-600">{appName.substring(4)}</span>
        </h1>
      </div>
      
      <nav className="flex-1 py-4 px-2 overflow-y-auto overflow-x-hidden space-y-1 scrollbar-hide">
        {menuGroups.map(group => {
          // Filter visible items for non-standalone groups
          const visibleItems = group.items?.filter(i => i.show) ?? [];
          
          // Skip groups with no visible items (and not standalone)
          if (!group.standalone && visibleItems.length === 0) return null;
          // Skip standalone items that shouldn't show
          if (group.standalone && group.show === false) return null;

          const active = isGroupActive(group);
          const GroupIcon = group.icon;
          const isOpen = openGroups.includes(group.id);

          // --- STANDALONE LINK ---
          if (group.standalone && group.href) {
            return (
              <Link
                key={group.id}
                href={group.href}
                className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-emerald-50 text-emerald-700 font-medium border border-emerald-200 shadow-sm"
                    : "hover:bg-emerald-100/60 hover:text-emerald-700 text-slate-500"
                }`}
              >
                <GroupIcon className={`w-5 h-5 flex-shrink-0 ${active ? "text-emerald-600" : ""}`} />
                <span className="opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto overflow-hidden whitespace-nowrap transition-all duration-300 text-sm">
                  {group.label}
                </span>
              </Link>
            );
          }

          // --- COLLAPSIBLE GROUP ---
          return (
            <div key={group.id}>
              {/* Group Header Button */}
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center px-3.5 py-3 rounded-xl transition-all duration-200 ${
                  active && !isOpen
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "hover:bg-emerald-100/60 hover:text-emerald-700 text-slate-500"
                }`}
              >
                <GroupIcon className={`w-5 h-5 flex-shrink-0 ${active ? "text-emerald-600" : ""}`} />
                <span className="opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto overflow-hidden whitespace-nowrap transition-all duration-300 text-sm font-medium ml-3 flex-1 text-left">
                  {group.label}
                </span>
                <ChevronDownIcon
                  className={`opacity-0 group-hover:opacity-100 w-3.5 h-3.5 flex-shrink-0 transition-transform duration-300 ml-auto ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Sub-items */}
              {isOpen && (
                <div className="mt-1 ml-3 pl-3 border-l border-slate-200 space-y-0.5 pb-1 transition-all duration-300">
                  {visibleItems.map(item => {
                    const isActive = pathname.startsWith(item.href);
                    const ItemIcon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={item.name}
                        className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 font-medium"
                            : "hover:bg-emerald-100/60 hover:text-emerald-700 text-slate-500"
                        }`}
                      >
                        <ItemIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-emerald-600" : ""}`} />
                        <span className="opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto overflow-hidden whitespace-nowrap transition-all duration-300 text-sm ml-3">
                          {item.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden whitespace-nowrap flex-shrink-0">
        <div className="bg-slate-50 rounded-xl p-4 text-xs border border-slate-200">
          <p className="font-semibold text-slate-800 mb-1">Butuh Bantuan?</p>
          <p className="text-slate-500 mb-3">Hubungi tim IT RW</p>
            <button className="w-full bg-emerald-700 hover:bg-emerald-600 text-white py-2 rounded-lg transition-colors font-medium">
            Kirim Tiket
          </button>
        </div>
      </div>
    </aside>
  );
}
