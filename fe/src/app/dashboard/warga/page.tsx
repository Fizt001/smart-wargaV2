"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PlusIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import UserFormModal from "@/components/modals/UserFormModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";

export default function WargaPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [activeTab, setActiveTab] = useState<"warga" | "approval">("warga");
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const fetchUsers = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${apiUrl}/api/users`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const data = await res.json();
      if (data.status === 'success') {
        // Filter out unapproved users from the main list (they are in pending tab)
        setUsers(data.data.filter((u: any) => u.is_approved));
      }
    } catch (error) {
      toast.error("Gagal mengambil data warga");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const fetchPendingUsers = async (silent = false) => {
    if (!silent) setIsLoadingPending(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${apiUrl}/api/pending-approvals`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setPendingUsers(data.data);
      }
    } catch (error) {
      toast.error("Gagal mengambil antrean approval");
    } finally {
      if (!silent) setIsLoadingPending(false);
    }
  };

  const [religions, setReligions] = useState<any[]>([]);
  const [maritalStatuses, setMaritalStatuses] = useState<any[]>([]);
  const [professions, setProfessions] = useState<any[]>([]);
  const [rts, setRts] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);

  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const token = localStorage.getItem("token");
        
        const res = await fetch(`${apiUrl}/api/master-data`, {
          headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
        });
        const data = await res.json();
        if (data.status === 'success') {
          setReligions(data.data.religions);
          setMaritalStatuses(data.data.marital_statuses);
          setProfessions(data.data.professions);
          setBlocks(data.data.blocks || []);

          // Get Current User
          const userRes = await fetch(`${apiUrl}/api/user`, {
            headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
          });
          const currentUser = await userRes.json();
          setUserData(currentUser);
          
          let filteredRoles = data.data.roles;
          if (currentUser && currentUser.role_id) {
            if (currentUser.role_id === 2) { // Ketua RW
              filteredRoles = data.data.roles.filter((r: any) => [3, 4, 5].includes(r.id));
            } else if (currentUser.role_id === 3) { // Ketua RT
              filteredRoles = data.data.roles.filter((r: any) => [6, 7, 8].includes(r.id));
            }
          }
          setRoles(filteredRoles);

          let filteredRts = data.data.rts;
          if (currentUser && currentUser.rt_id && [3, 6].includes(currentUser.role_id)) {
            filteredRts = data.data.rts.filter((rt: any) => rt.id === currentUser.rt_id);
          }
          setRts(filteredRts);
        }
      } catch (error) {
        console.error("Gagal mengambil master data", error);
      }
    };

    fetchUsers();
    fetchPendingUsers();
    fetchMasterData();
    
    const interval = setInterval(() => {
      fetchUsers(true);
      fetchPendingUsers(true);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (user: any) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleSaveUser = async (formData: any) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const url = selectedUser 
        ? `${apiUrl}/api/users/${selectedUser.id}` 
        : `${apiUrl}/api/users`;
        
      const method = selectedUser ? "PUT" : "POST";

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
      
      if (!res.ok) {
        throw new Error(data.message || "Terjadi kesalahan validasi");
      }

      toast.success(data.message);
      fetchUsers(); // Reload data
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setIsDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${apiUrl}/api/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });

      if (!res.ok) throw new Error("Gagal menghapus");

      toast.success("Warga berhasil dihapus");
      fetchUsers();
      setIsDeleteOpen(false);
    } catch (error) {
      toast.error("Gagal menghapus warga");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${apiUrl}/api/users/${id}/approve`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success("Berhasil menyetujui warga");
      fetchPendingUsers();
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Gagal menyetujui");
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Tolak dan hapus data registrasi ini?")) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${apiUrl}/api/users/${id}/reject`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success("Pendaftaran ditolak");
      fetchPendingUsers();
    } catch (e: any) {
      toast.error(e.message || "Gagal menolak");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {userData?.role_id === 1 ? "Data Pengurus" : "Data Warga"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {userData?.role_id === 1 ? "Kelola data pengurus sistem." : "Kelola data penduduk Blok Erika."}
          </p>
        </div>
        {userData && [1, 2, 3].includes(userData.role_id) && (
          <button 
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-blue-500/30 transition-all flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>{userData?.role_id === 1 ? "Tambah Pengurus" : "Tambah Warga"}</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setActiveTab("warga")}
            className={`flex-1 py-4 text-sm font-semibold text-center transition-colors border-b-2 ${activeTab === 'warga' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {userData?.role_id === 1 ? "Daftar Pengurus Aktif" : "Daftar Warga Aktif"}
          </button>
          {userData && [1, 3, 4, 6].includes(userData.role_id) && (
            <button
              onClick={() => setActiveTab("approval")}
              className={`flex-1 py-4 text-sm font-semibold text-center transition-colors border-b-2 flex items-center justify-center space-x-2 ${activeTab === 'approval' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <span>Antrean Persetujuan</span>
              {pendingUsers.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {pendingUsers.length}
                </span>
              )}
            </button>
          )}
        </div>

        {activeTab === "warga" ? (
          <>
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative w-full sm:w-72">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama atau NIK..." 
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="w-full sm:w-auto">
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full sm:w-48 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="">Semua Peran</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                  {/* Warga role typically is default or explicitly listed. If not in roles array, we can filter by 'null' or fallback */}
                  <option value="warga">Warga Biasa</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Nama / Email</th>
                    <th className="px-6 py-4 font-medium">No. Rumah</th>
                    <th className="px-6 py-4 font-medium">No. HP</th>
                    <th className="px-6 py-4 font-medium">Peran</th>
                    <th className="px-6 py-4 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Memuat data...</td>
                    </tr>
                  ) : users.filter(u => {
                      if (userData?.role_id === 1) return true;
                      if (userData?.id === u.id) return true;
                      if (userData?.role_id === 2 && [3, 4, 5].includes(u.role_id)) return true;
                      if (userData?.role_id === 3 && [6, 7, 8].includes(u.role_id)) return true;
                      return false;
                  }).filter(u => {
                    const matchSearch = !searchQuery || 
                      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      (u.nik && u.nik.toLowerCase().includes(searchQuery.toLowerCase()));
                    
                    let matchRole = true;
                    if (roleFilter === "warga") {
                      matchRole = !u.role_id;
                    } else if (roleFilter) {
                      matchRole = u.role_id === parseInt(roleFilter);
                    }
                    
                    return matchSearch && matchRole;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Belum ada data warga yang dapat Anda akses atau sesuai pencarian.</td>
                    </tr>
                  ) : (
                    users.filter(u => {
                      if (userData?.role_id === 1) return true;
                      if (userData?.id === u.id) return true;
                      if (userData?.role_id === 2 && [3, 4, 5].includes(u.role_id)) return true;
                      if (userData?.role_id === 3 && [6, 7, 8].includes(u.role_id)) return true;
                      return false;
                    }).filter(u => {
                      const matchSearch = !searchQuery || 
                        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (u.nik && u.nik.toLowerCase().includes(searchQuery.toLowerCase()));
                      
                      let matchRole = true;
                      if (roleFilter === "warga") {
                        matchRole = !u.role_id;
                      } else if (roleFilter) {
                        matchRole = u.role_id === parseInt(roleFilter);
                      }
                      
                      return matchSearch && matchRole;
                    }).map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm border border-blue-200">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{u.name}</p>
                              <p className="text-xs text-slate-500">{u.email || "Tidak ada email"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {u.house ? `${u.house.block?.name || u.block?.name} - ${u.house.number}` : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {u.phone_number || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {u.role?.name || "Warga"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {userData && [1, 2, 3, 4, 6].includes(userData.role_id) ? (
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => handleOpenEdit(u)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <PencilSquareIcon className="w-5 h-5" />
                              </button>
                              {userData?.id !== u.id && (
                                <button 
                                  onClick={() => handleOpenDelete(u)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Hapus"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">View Only</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="overflow-x-auto p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-amber-50 text-amber-700 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Pendaftar</th>
                  <th className="px-6 py-4 font-medium">Domisili Pilihan</th>
                  <th className="px-6 py-4 font-medium">Waktu Daftar</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi Persetujuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingPending ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Memuat antrean...</td></tr>
                ) : pendingUsers.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Tidak ada pendaftar baru yang menunggu persetujuan.</td></tr>
                ) : (
                  pendingUsers.map(pu => (
                    <tr key={pu.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{pu.name}</p>
                        <p className="text-xs text-slate-500">NIK: {pu.nik}</p>
                        <p className="text-xs text-slate-500">WA: {pu.phone_number}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <span className="font-medium">{pu.rt?.name}</span><br />
                        {pu.house?.block?.name || pu.block?.name} - No. {pu.house?.number}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(pu.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleReject(pu.id)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                          >
                            Tolak
                          </button>
                          <button 
                            onClick={() => handleApprove(pu.id)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-500/30 rounded-lg transition-colors"
                          >
                            {userData && [4, 6].includes(userData.role_id) ? "Validasi Dokumen" : "Setujui Warga"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        user={selectedUser}
        onSave={handleSaveUser}
        roles={roles}
        religions={religions}
        maritalStatuses={maritalStatuses}
        professions={professions}
        rts={rts}
        blocks={blocks}
        userType={userData?.role_id === 1 ? "Pengurus" : "Warga"}
      />

      <ConfirmDeleteModal 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        message={`Apakah Anda yakin ingin menghapus warga bernama "${selectedUser?.name}"?`}
      />
    </div>
  );
}
