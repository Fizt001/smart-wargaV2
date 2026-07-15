"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PlusIcon, PencilSquareIcon, TrashIcon, MapIcon, HomeModernIcon } from "@heroicons/react/24/outline";
import RtFormModal from "@/components/modals/RtFormModal";
import BlockFormModal from "@/components/modals/BlockFormModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import GenerateHouseModal from "@/components/modals/GenerateHouseModal";
import { useRouter } from "next/navigation";

export default function WilayahPage() {
  const router = useRouter();
  const [rts, setRts] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);
  const [selectedBlockForHouses, setSelectedBlockForHouses] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHouses, setIsLoadingHouses] = useState(false);
  const [activeTab, setActiveTab] = useState<"rt" | "block">("rt");
  
  // Auth State
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Modal States
  const [isRtFormOpen, setIsRtFormOpen] = useState(false);
  const [isBlockFormOpen, setIsBlockFormOpen] = useState(false);
  const [isGenerateHouseOpen, setIsGenerateHouseOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<"rt" | "block" | "house" | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const checkAuth = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");

      const res = await fetch(`${apiUrl}/api/user`, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return router.push("/login");
      }
      const data = await res.json();
      const user = data.data || data; // Handle both wrapped and unwrapped

      if (user && (user.role_id == 1 || user.role_id == 2)) {
        setIsAuthorized(true);
      } else {
        toast.error("Akses ditolak");
        router.push("/dashboard");
      }
    } catch (e) {
      router.push("/dashboard");
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const resRts = await fetch(`${apiUrl}/api/rts`, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const dataRts = await resRts.json();
      if (dataRts.status === 'success') setRts(dataRts.data);

      const resBlocks = await fetch(`${apiUrl}/api/blocks`, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const dataBlocks = await resBlocks.json();
      if (dataBlocks.status === 'success') setBlocks(dataBlocks.data);
      
    } catch (error) {
      toast.error("Gagal mengambil data wilayah");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHouses = async (block: any) => {
    setIsLoadingHouses(true);
    setSelectedBlockForHouses(block);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${apiUrl}/api/blocks/${block.id}/houses`, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setHouses(data.data);
      }
    } catch (error) {
      toast.error("Gagal mengambil data rumah");
    } finally {
      setIsLoadingHouses(false);
    }
  };

  useEffect(() => {
    checkAuth().then(() => {
      fetchData();
    });
  }, []);

  if (!isAuthorized) return null; // Prevent flicker

  const handleSaveRt = async (formData: any) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const url = selectedItem ? `${apiUrl}/api/rts/${selectedItem.id}` : `${apiUrl}/api/rts`;
      const method = selectedItem ? "PUT" : "POST";

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
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan RT");
      
      toast.success(data.message);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
      throw e;
    }
  };

  const handleSaveBlock = async (formData: any) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const url = selectedItem ? `${apiUrl}/api/blocks/${selectedItem.id}` : `${apiUrl}/api/blocks`;
      const method = selectedItem ? "PUT" : "POST";

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
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan Blok");
      
      toast.success(data.message);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
      throw e;
    }
  };

  const handleGenerateHouses = async (count: number) => {
    if (!selectedBlockForHouses) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${apiUrl}/api/blocks/${selectedBlockForHouses.id}/generate-houses`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ count })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal men-generate rumah");
      
      toast.success(data.message);
      fetchHouses(selectedBlockForHouses); // Reload houses
    } catch (e: any) {
      toast.error(e.message);
      throw e;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem || !deleteType) return;
    setIsDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const endpoint = deleteType === "rt" ? "rts" : deleteType === "block" ? "blocks" : "houses";
      
      const res = await fetch(`${apiUrl}/api/${endpoint}/${selectedItem.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menghapus data");

      toast.success(data.message);
      if (deleteType === "house" && selectedBlockForHouses) {
        fetchHouses(selectedBlockForHouses);
      } else {
        fetchData();
      }
      setIsDeleteOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (item: any, type: "rt" | "block" | "house") => {
    setSelectedItem(item);
    setDeleteType(type);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Master Data Wilayah</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola Rukun Tetangga (RT) dan Blok Perumahan.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => { setSelectedItem(null); setIsRtFormOpen(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/30 transition-all flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Tambah RT</span>
          </button>
          <button 
            onClick={() => { setSelectedItem(null); setIsBlockFormOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Tambah Blok</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setActiveTab("rt")}
            className={`flex-1 py-4 text-sm font-semibold text-center transition-colors border-b-2 ${activeTab === 'rt' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <MapIcon className="w-5 h-5 inline-block mr-2" />
            Manajemen RT
          </button>
          <button
            onClick={() => setActiveTab("block")}
            className={`flex-1 py-4 text-sm font-semibold text-center transition-colors border-b-2 ${activeTab === 'block' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <HomeModernIcon className="w-5 h-5 inline-block mr-2" />
            Manajemen Blok
          </button>
        </div>

        <div className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Memuat data wilayah...</div>
          ) : (
            <div className="overflow-x-auto">
              {activeTab === "rt" ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">Nama RT</th>
                      <th className="px-6 py-4 font-medium text-center">Jumlah Blok</th>
                      <th className="px-6 py-4 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rts.length === 0 ? (
                      <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">Belum ada data RT.</td></tr>
                    ) : (
                      rts.map(rt => (
                        <tr key={rt.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">{rt.name}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 min-w-[2rem]">
                              {rt.blocks_count || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <button onClick={() => { setSelectedItem(rt); setIsRtFormOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><PencilSquareIcon className="w-5 h-5" /></button>
                              <button onClick={() => openDeleteModal(rt, "rt")} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 font-semibold text-slate-700">
                      Daftar Blok
                    </div>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                          <th className="px-4 py-3 font-medium">Nama Blok</th>
                          <th className="px-4 py-3 font-medium">RT</th>
                          <th className="px-4 py-3 font-medium text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {blocks.length === 0 ? (
                          <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Belum ada data Blok.</td></tr>
                        ) : (
                          blocks.map(block => (
                            <tr 
                              key={block.id} 
                              onClick={() => fetchHouses(block)}
                              className={`cursor-pointer transition-colors ${selectedBlockForHouses?.id === block.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                            >
                              <td className="px-4 py-3 font-semibold text-slate-800">{block.name}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">
                                  {block.rt?.name || "-"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end space-x-1">
                                  <button onClick={(e) => { e.stopPropagation(); setSelectedItem(block); setIsBlockFormOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"><PencilSquareIcon className="w-4 h-4" /></button>
                                  <button onClick={(e) => { e.stopPropagation(); openDeleteModal(block, "block"); }} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                      <span className="font-semibold text-slate-700">
                        {selectedBlockForHouses ? `Rumah di ${selectedBlockForHouses.name}` : 'Pilih Blok di samping'}
                      </span>
                      {selectedBlockForHouses && (
                        <button 
                          onClick={() => setIsGenerateHouseOpen(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          Generate Nomor
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[400px]">
                      {!selectedBlockForHouses ? (
                        <div className="p-8 text-center text-slate-400 text-sm">Silakan pilih Blok terlebih dahulu untuk melihat daftar rumah.</div>
                      ) : isLoadingHouses ? (
                        <div className="p-8 text-center text-slate-400 text-sm">Memuat rumah...</div>
                      ) : (
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                              <th className="px-4 py-3 font-medium">Nomor Rumah</th>
                              <th className="px-4 py-3 font-medium">Pemegang Akun Utama</th>
                              <th className="px-4 py-3 font-medium text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {houses.length === 0 ? (
                              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">Belum ada rumah di blok ini.</td></tr>
                            ) : (
                              houses.map(house => (
                                <tr key={house.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3 font-medium text-slate-800">{house.number}</td>
                                  <td className="px-4 py-3 text-sm">
                                    {house.users && house.users.length > 0 ? (
                                      <div className="flex flex-col space-y-1">
                                        {house.users.map((u: any) => (
                                          <span key={u.id} className="text-slate-700">{u.name} {u.role_id === 8 ? '(Warga)' : ''}</span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic">Kosong</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button 
                                      onClick={() => openDeleteModal(house, "house")} 
                                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Hapus Rumah"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <RtFormModal 
        isOpen={isRtFormOpen} 
        onClose={() => setIsRtFormOpen(false)} 
        rt={selectedItem} 
        onSave={handleSaveRt} 
      />

      <BlockFormModal 
        isOpen={isBlockFormOpen} 
        onClose={() => setIsBlockFormOpen(false)} 
        block={selectedItem} 
        rts={rts} 
        onSave={handleSaveBlock} 
      />

      <GenerateHouseModal
        isOpen={isGenerateHouseOpen}
        onClose={() => setIsGenerateHouseOpen(false)}
        blockName={selectedBlockForHouses?.name || ""}
        onGenerate={handleGenerateHouses}
      />

      <ConfirmDeleteModal 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        message={`Apakah Anda yakin ingin menghapus data ${deleteType === 'rt' ? 'RT' : deleteType === 'block' ? 'Blok' : 'Rumah'} "${selectedItem?.name || selectedItem?.number}"?`}
      />
    </div>
  );
}
