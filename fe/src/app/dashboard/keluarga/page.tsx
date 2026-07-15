"use client";

import { useState, useEffect } from "react";
import { 
  UsersIcon, 
  PlusCircleIcon,
  UserPlusIcon,
  HomeIcon,
  IdentificationIcon,
  CheckCircleIcon,
  UserIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function KeluargaPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Modal toggle for admins viewing detail
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [targetUserName, setTargetUserName] = useState<string>("");

  // List mode state
  const [wargas, setWargas] = useState<any[]>([]);
  const [isLoadingWargas, setIsLoadingWargas] = useState(false);
  const [rts, setRts] = useState<any[]>([]);
  const [religions, setReligions] = useState<any[]>([]);
  const [relationStatuses, setRelationStatuses] = useState<any[]>([]);
  const [selectedRtId, setSelectedRtId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail mode state
  const [families, setFamilies] = useState<any[]>([]);
  const [isLoadingFamilies, setIsLoadingFamilies] = useState(false);
  
  // Modal states
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [newKkNumber, setNewKkNumber] = useState("");
  
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  
  // Member form
  const [mName, setMName] = useState("");
  const [mNik, setMNik] = useState("");
  const [mBirthDate, setMBirthDate] = useState("");
  const [mFamilyRelationStatusId, setMFamilyRelationStatusId] = useState<string>("");
  const [mReligionId, setMReligionId] = useState<string>("");
  const [mKkNumber, setMKkNumber] = useState(""); 
  
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Move House Modal states
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveType, setMoveType] = useState('within_rt');
  const [newRtId, setNewRtId] = useState('');
  const [newBlockId, setNewBlockId] = useState('');
  const [newHouseNumber, setNewHouseNumber] = useState('');
  const [moveReason, setMoveReason] = useState('');
  const [blocks, setBlocks] = useState<any[]>([]);

  // Move Requests List for Admin/RT
  const [moveRequests, setMoveRequests] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      try {
        const res = await fetch(`${apiUrl}/api/user`, {
          headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
        });
        const data = await res.json();
        setCurrentUser(data);
        
        if (data && data.role_id !== 8) {
          if ([1, 2, 4, 5].includes(data.role_id)) {
            // Fetch RTs for SA/RW
            const rtRes = await fetch(`${apiUrl}/api/master-data`, {
              headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
            });
            const rtData = await rtRes.json();
            setRts(rtData.data?.rts || []);
            setBlocks(rtData.data?.blocks || []);
            setReligions(rtData.data?.religions || []);
            setRelationStatuses(rtData.data?.family_relation_statuses || []);
          } else if ([3, 6, 7].includes(data.role_id)) {
            setSelectedRtId(data.rt_id?.toString() || "");
          }
        } else if (data && data.role_id === 8) {
          setTargetUserId(data.id);
          setTargetUserName(data.name);
          setTargetUserName(data.name);
          setIsDetailModalOpen(true); // For warga, it's always "open" conceptually (rendered inline)
          
          // Fetch master data for warga too to get religions
          const masterRes = await fetch(`${apiUrl}/api/master-data`, {
            headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
          });
          const masterData = await masterRes.json();
          setReligions(masterData.data?.religions || []);
          setRelationStatuses(masterData.data?.family_relation_statuses || []);
          setRts(masterData.data?.rts || []);
          setBlocks(masterData.data?.blocks || []);
        }
      } catch (err) {}
    };
    init();
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role_id !== 8) {
      fetchWargas();
    }
  }, [currentUser, selectedRtId]);

  const fetchWargas = async () => {
    setIsLoadingWargas(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/users`, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const data = await res.json();
      if (data.status === 'success') {
        let filtered = data.data.filter((u: any) => u.role_id === 8 && u.is_approved);
        if (selectedRtId) {
          filtered = filtered.filter((u: any) => u.rt_id?.toString() === selectedRtId.toString());
        }
        setWargas(filtered);
      }
    } catch (err) {} finally {
      setIsLoadingWargas(false);
    }
  };

  const fetchMoveRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/house-move-requests`, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setMoveRequests(data.data.filter((r: any) => r.status === 'pending'));
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (currentUser && currentUser.role_id !== 8) {
      fetchMoveRequests();
    }
  }, [currentUser, selectedRtId]);

  useEffect(() => {
    if (isDetailModalOpen && targetUserId) {
      fetchFamilies();
    }
  }, [isDetailModalOpen, targetUserId]);

  const fetchFamilies = async () => {
    setIsLoadingFamilies(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      let url = `${apiUrl}/api/families`;
      if (currentUser?.role_id !== 8 && targetUserId) {
         url += `?user_id=${targetUserId}`;
      }
      
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setFamilies(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingFamilies(false);
    }
  };

  const handleAddFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const body: any = { type: "tambahan", kk_number: newKkNumber };
      if (currentUser?.role_id !== 8 && targetUserId) body.user_id = targetUserId;
      
      const res = await fetch(`${apiUrl}/api/families`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (res.ok) {
        setNewKkNumber("");
        setIsFamilyModalOpen(false);
        fetchFamilies();
      } else {
        setMessage(data.message || "Gagal menambah KK Tambahan");
      }
    } catch (err) {
      setMessage("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFamilyId) return;
    
    setIsSubmitting(true);
    setMessage("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const url = editingMemberId 
        ? `${apiUrl}/api/families/${selectedFamilyId}/members/${editingMemberId}`
        : `${apiUrl}/api/families/${selectedFamilyId}/members`;
      const method = editingMemberId ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: mName,
          nik: mNik,
          birth_date: mBirthDate,
          family_relation_status_id: mFamilyRelationStatusId,
          religion_id: mReligionId || null
        })
      });
      
      if (res.ok) {
        const isKepalaKeluarga = relationStatuses.find(r => r.id.toString() === mFamilyRelationStatusId)?.name?.toLowerCase().includes('kepala');
        if (isKepalaKeluarga && mKkNumber) {
          const family = families.find(f => f.id === selectedFamilyId);
          if (family) {
             const bodyKk: any = { type: family.type, kk_number: mKkNumber };
             if (currentUser?.role_id !== 8 && targetUserId) bodyKk.user_id = targetUserId;
             
             await fetch(`${apiUrl}/api/families`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
              body: JSON.stringify(bodyKk)
            });
          }
        }

        setMName(""); setMNik(""); setMBirthDate(""); setMFamilyRelationStatusId(""); setMKkNumber(""); setMReligionId("");
        setEditingMemberId(null);
        setIsMemberModalOpen(false);
        fetchFamilies();
      } else {
        const data = await res.json();
        setMessage(data.message || (editingMemberId ? "Gagal memperbarui anggota" : "Gagal menambah anggota"));
      }
    } catch (err) {
      setMessage("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMemberModal = (familyId: number) => {
    setSelectedFamilyId(familyId);
    setEditingMemberId(null);
    setMName(""); setMNik(""); setMBirthDate(""); setMFamilyRelationStatusId(""); setMKkNumber(""); setMReligionId("");
    setMessage("");
    setIsMemberModalOpen(true);
  };

  const openEditModal = (familyId: number, member: any) => {
    setSelectedFamilyId(familyId);
    setEditingMemberId(member.id);
    setMName(member.name);
    setMNik(member.nik || "");
    setMBirthDate(member.birth_date ? member.birth_date.split('T')[0] : "");
    setMFamilyRelationStatusId(member.family_relation_status_id?.toString() || "");
    setMReligionId(member.religion_id?.toString() || "");
    setMKkNumber("");
    setMessage("");
    setIsMemberModalOpen(true);
  };

  const submitMoveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${apiUrl}/api/house-move-requests`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          type: moveType,
          new_rt_id: newRtId || null,
          new_block_id: newBlockId || null,
          new_house_number: newHouseNumber || null,
          reason: moveReason || null
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setIsMoveModalOpen(false);
        MySwal.fire({
          title: 'Berhasil!',
          text: 'Pengajuan pindah rumah berhasil dikirim dan menunggu konfirmasi RT/Pengurus.',
          icon: 'success',
          confirmButtonColor: '#4f46e5'
        });
      } else {
        MySwal.fire({
          title: 'Gagal',
          text: data.message || 'Gagal mengirim pengajuan.',
          icon: 'error',
          confirmButtonColor: '#4f46e5'
        });
      }
    } catch (err) {
      MySwal.fire('Error', 'Terjadi kesalahan sistem', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveMove = async (id: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${apiUrl}/api/house-move-requests/${id}/approve`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      
      if (res.ok) {
        MySwal.fire('Berhasil', 'Pengajuan pindah rumah berhasil disetujui.', 'success');
        fetchMoveRequests();
        fetchWargas();
      } else {
        const data = await res.json();
        MySwal.fire('Gagal', data.message || 'Gagal menyetujui pengajuan.', 'error');
      }
    } catch (err) {
      MySwal.fire('Error', 'Terjadi kesalahan sistem', 'error');
    }
  };

  const handleRejectMove = async (id: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${apiUrl}/api/house-move-requests/${id}/reject`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      
      if (res.ok) {
        MySwal.fire('Berhasil', 'Pengajuan pindah rumah berhasil ditolak.', 'success');
        fetchMoveRequests();
      } else {
        const data = await res.json();
        MySwal.fire('Gagal', data.message || 'Gagal menolak pengajuan.', 'error');
      }
    } catch (err) {
      MySwal.fire('Error', 'Terjadi kesalahan sistem', 'error');
    }
  };

  const filteredWargas = wargas.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const activeUser = currentUser?.role_id === 8 ? currentUser : wargas.find(w => w.id === targetUserId);

  const renderDetailContent = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 shrink-0" />
            <span>Profil Keluarga {currentUser?.role_id !== 8 && targetUserName ? `- ${targetUserName}` : ''}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Kelola data Kartu Keluarga (KK) Inti dan KK Tambahan.</p>
        </div>
        <button 
          onClick={() => { setIsFamilyModalOpen(true); setMessage(""); }} 
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 shrink-0"
        >
          <PlusCircleIcon className="w-5 h-5 shrink-0" /> Tambah KK Tambahan
        </button>
      </div>

      {activeUser && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 sm:p-5 mb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2 sm:mt-0">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <HomeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-indigo-600 font-medium mb-0.5">Informasi Domisili</p>
              <p className="text-base sm:text-lg font-bold text-slate-800 truncate">
                {activeUser?.rt ? activeUser.rt.name : 'Belum ada RT'} - {activeUser?.house?.block?.name ? `${activeUser.house.block.name}` : ''} No. {activeUser?.house?.number || '-'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              if (currentUser?.role_id === 8) {
                setIsMoveModalOpen(true);
              } else {
                MySwal.fire({
                  title: 'Info',
                  text: 'Fitur memindahkan warga secara langsung oleh pengurus sedang dikembangkan. Warga bisa mengajukan pindah dari akunnya.',
                  icon: 'info',
                  confirmButtonColor: '#4f46e5'
                });
              }
            }}
            className="w-full sm:w-auto text-sm font-semibold text-indigo-600 bg-white border border-indigo-200 px-4 py-2.5 sm:py-2 rounded-xl hover:bg-indigo-50 transition-colors shrink-0 flex justify-center items-center"
          >
            Pindah Rumah
          </button>
        </div>
      )}

      {isLoadingFamilies ? (
        <div className="text-center py-10 text-slate-500">Memuat data keluarga...</div>
      ) : (
        <div className="space-y-8">
          {families.map((family) => (
            <div key={family.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className={`p-4 sm:p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${family.type === 'inti' ? 'bg-gradient-to-r from-blue-50 to-white border-blue-100' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 mt-1 sm:mt-0 ${family.type === 'inti' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-200 text-slate-600'}`}>
                    <HomeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex flex-wrap items-center gap-2">
                      <span>{family.type === 'inti' ? 'Kartu Keluarga Inti' : 'Kartu Keluarga Tambahan'}</span>
                      {family.type === 'inti' && <span className="bg-emerald-100 text-emerald-700 text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Utama</span>}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 flex items-center mt-1">
                      <IdentificationIcon className="w-4 h-4 mr-1 shrink-0" />
                      <span className="whitespace-nowrap">No. KK:</span> <span className="font-semibold text-slate-700 ml-1 truncate">{family.kk_number || 'Belum diisi'}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => openMemberModal(family.id)} className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0">
                  <UserPlusIcon className="w-4 h-4 shrink-0" /> Tambah Anggota
                </button>
              </div>

              {/* Mobile View */}
              <div className="md:hidden divide-y divide-slate-100">
                {family.members && family.members.length > 0 ? (
                  family.members.map((m: any) => (
                    <div key={m.id} className="p-4 space-y-3 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                            <UserIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm leading-tight">{m.name}</div>
                            <div className="text-xs text-slate-500 font-mono mt-1">{m.nik || '-'}</div>
                          </div>
                        </div>
                        <button onClick={() => openEditModal(family.id, m)} className="text-blue-600 hover:text-blue-700 text-xs font-semibold px-3 py-1.5 bg-blue-50 rounded-lg shrink-0 transition-colors">
                          Edit
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 pl-11">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          m.familyRelationStatus?.name?.toLowerCase().includes('kepala') ? 'bg-indigo-50 text-indigo-700' :
                          m.familyRelationStatus?.name?.toLowerCase().includes('istri') ? 'bg-pink-50 text-pink-700' :
                          m.familyRelationStatus?.name?.toLowerCase().includes('anak') ? 'bg-teal-50 text-teal-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {m.familyRelationStatus ? m.familyRelationStatus.name : m.relationship}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          • {m.age !== null ? `${m.age} thn` : '-'} 
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          • {m.religion ? m.religion.name : '-'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 italic text-sm">Belum ada data anggota keluarga.</div>
                )}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      <th className="py-3 px-6">Nama Lengkap</th>
                      <th className="py-3 px-6">NIK</th>
                      <th className="py-3 px-6">Hubungan</th>
                      <th className="py-3 px-6">Agama</th>
                      <th className="py-3 px-6 text-right">Umur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {family.members && family.members.length > 0 ? (
                      family.members.map((m: any) => (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="py-4 px-6 text-sm font-bold text-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors shrink-0">
                                <UserIcon className="w-4 h-4" />
                              </div>
                              {m.name}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600 font-mono">{m.nik || '-'}</td>
                          <td className="py-4 px-6 text-sm">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                              m.familyRelationStatus?.name?.toLowerCase().includes('kepala') ? 'bg-indigo-50 text-indigo-700' :
                              m.familyRelationStatus?.name?.toLowerCase().includes('istri') ? 'bg-pink-50 text-pink-700' :
                              m.familyRelationStatus?.name?.toLowerCase().includes('anak') ? 'bg-teal-50 text-teal-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {m.familyRelationStatus ? m.familyRelationStatus.name : m.relationship}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600 font-medium">
                            {m.religion ? m.religion.name : '-'}
                          </td>
                          <td className="py-4 px-6 text-sm font-bold text-slate-700 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <span className="whitespace-nowrap">{m.age !== null ? `${m.age} thn` : '-'}</span>
                              <button onClick={() => openEditModal(family.id, m)} className="text-blue-500 hover:text-blue-700 text-xs font-semibold px-2 py-1 bg-blue-50 rounded-lg shrink-0">Edit</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 italic">Belum ada data anggota keluarga.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {currentUser?.role_id !== 8 && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <UsersIcon className="w-8 h-8 text-blue-600" />
                Data Keluarga Warga
              </h1>
              <p className="text-slate-500 mt-1">Pilih warga untuk melihat dan mengelola profil keluarganya.</p>
            </div>
          </div>

          {moveRequests.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-amber-800 flex items-center gap-2 mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
                Menunggu Konfirmasi Pindah Rumah
              </h2>
              <div className="space-y-3">
                {moveRequests.map((req: any) => (
                  <div key={req.id} className="bg-white p-4 rounded-xl border border-amber-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="font-bold text-slate-800">{req.user?.name}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        Jenis: <span className="font-medium text-slate-800">{req.type === 'out' ? 'Pindah Keluar Perumahan' : (req.type === 'cross_rt' ? 'Pindah Lintas RT' : 'Pindah Dalam RT')}</span>
                      </div>
                      <div className="text-sm text-slate-600">
                        Mutasi: <span className="font-medium">{req.old_rt?.name || 'RT Lama'} {req.old_house?.block?.name ? `(${req.old_house?.block?.name} No. ${req.old_house?.number})` : ''}</span> ➡️ <span className="font-medium">{req.type === 'out' ? 'Luar Perumahan' : `${req.new_rt?.name || 'RT Baru'} (${req.new_block?.name || 'Blok Baru'} No. ${req.new_house_number})`}</span>
                      </div>
                      {req.reason && <div className="text-sm text-slate-500 mt-1 italic">"{req.reason}"</div>}
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button onClick={() => handleRejectMove(req.id)} className="flex-1 md:flex-none px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-lg text-sm transition-colors">
                        Tolak
                      </button>
                      <button onClick={() => handleApproveMove(req.id)} className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-medium rounded-lg text-sm transition-colors shadow-sm shadow-indigo-600/30">
                        Setujui
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama warga..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {[1, 2, 4, 5].includes(currentUser?.role_id) && (
                <select
                  value={selectedRtId}
                  onChange={(e) => setSelectedRtId(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium text-slate-700 min-w-[200px]"
                >
                  <option value="">Semua RT</option>
                  {rts.map((rt) => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Nama Warga</th>
                    <th className="px-6 py-4 font-semibold">RT / Domisili</th>
                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingWargas ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">Memuat data...</td></tr>
                  ) : filteredWargas.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">Tidak ada warga ditemukan.</td></tr>
                  ) : filteredWargas.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{w.name}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {w.rt?.name} {w.house?.block?.name ? `- ${w.house.block.name} No. ${w.house.number}` : ''}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setTargetUserId(w.id);
                            setTargetUserName(w.name);
                            setIsDetailModalOpen(true);
                          }}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium text-xs inline-flex items-center justify-end gap-1 ml-auto transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" /> Lihat KK
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* RENDER DETAIL CONTENT: Inline for Warga, Modal for Admins */}
      {currentUser?.role_id === 8 ? (
        isDetailModalOpen && renderDetailContent() // For warga, it's just rendered directly in the page flow
      ) : (
        // For admin, it's rendered inside a modal wrapper
        isDetailModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">Detail Profil Keluarga</h2>
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                {renderDetailContent()}
              </div>
            </div>
          </div>
        )
      )}

      {/* MODAL TAMBAH KK TAMBAHAN */}
      {isFamilyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><PlusCircleIcon className="w-6 h-6 text-blue-600"/> Tambah KK Tambahan</h2>
            </div>
            <form onSubmit={handleAddFamily} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Kartu Keluarga (Opsional)</label>
                <input
                  type="text"
                  value={newKkNumber}
                  onChange={(e) => setNewKkNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Masukkan 16 digit No. KK"
                  maxLength={16}
                />
              </div>
              {message && <p className="text-sm text-red-500">{message}</p>}
              <div className="mt-8 flex gap-3 pt-4">
                <button type="button" onClick={() => setIsFamilyModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">Simpan KK Baru</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH ANGGOTA KELUARGA */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><UserPlusIcon className="w-6 h-6 text-blue-600"/> {editingMemberId ? 'Edit Anggota Keluarga' : 'Tambah Anggota Keluarga'}</h2>
              <button type="button" onClick={() => setIsMemberModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleAddMember} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input type="text" value={mName} onChange={(e) => setMName(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nama sesuai KTP/KK" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status Hubungan</label>
                <select value={mFamilyRelationStatusId} onChange={(e) => setMFamilyRelationStatusId(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">-- Pilih Status Hubungan --</option>
                  {relationStatuses.map((rs: any) => (
                    <option key={rs.id} value={rs.id}>{rs.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Agama</label>
                <select value={mReligionId} onChange={(e) => setMReligionId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">-- Pilih Agama --</option>
                  {religions.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              
              {relationStatuses.find(r => r.id.toString() === mFamilyRelationStatusId)?.name?.toLowerCase().includes('kepala') && (!families.find(f => f.id === selectedFamilyId)?.kk_number) && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <label className="block text-sm font-bold text-indigo-800 mb-1">Nomor Kartu Keluarga</label>
                  <p className="text-xs text-indigo-600 mb-2">Karena ini Kepala Keluarga, lengkapi No. KK untuk keluarga ini.</p>
                  <input type="text" value={mKkNumber} onChange={(e) => setMKkNumber(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm bg-white" placeholder="16 digit No. KK" maxLength={16} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NIK (Nomor KTP)</label>
                  <input type="text" value={mNik} onChange={(e) => setMNik(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" placeholder="Opsional untuk anak" maxLength={16} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Lahir</label>
                  <input type="date" value={mBirthDate} onChange={(e) => setMBirthDate(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              
              {message && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                  <span>{message}</span>
                </div>
              )}
              
              <div className="mt-8 flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsMemberModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting || !mName || !mBirthDate} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-2">
                  <CheckCircleIcon className="w-5 h-5"/> Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL PINDAH RUMAH */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><HomeIcon className="w-6 h-6 text-indigo-600"/> Pengajuan Pindah Rumah</h2>
              <button type="button" onClick={() => setIsMoveModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={submitMoveRequest} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Jenis Kepindahan</label>
                <select value={moveType} onChange={(e) => setMoveType(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="within_rt">Pindah di dalam RT yang sama</option>
                  <option value="cross_rt">Pindah Lintas RT (Tetap di Perumahan)</option>
                  <option value="out">Pindah Keluar Perumahan</option>
                </select>
              </div>

              {moveType !== 'out' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <h3 className="font-bold text-slate-700 text-sm">Alamat Baru</h3>
                  
                  {moveType === 'cross_rt' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Pilih RT Baru</label>
                      <select value={newRtId} onChange={(e) => setNewRtId(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm">
                        <option value="">-- Pilih RT --</option>
                        {rts.map((rt: any) => (
                          <option key={rt.id} value={rt.id}>{rt.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Blok Baru</label>
                      <select value={newBlockId} onChange={(e) => setNewBlockId(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm">
                        <option value="">-- Pilih Blok --</option>
                        {(moveType === 'within_rt' 
                           ? blocks.filter((b: any) => b.rt_id === currentUser?.rt_id)
                           : blocks.filter((b: any) => b.rt_id?.toString() === newRtId)
                         ).map((block: any) => (
                          <option key={block.id} value={block.id}>{block.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nomor Rumah</label>
                      <input type="text" value={newHouseNumber} onChange={(e) => setNewHouseNumber(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Misal: 12A" />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alasan Pindah (Opsional)</label>
                <textarea value={moveReason} onChange={(e) => setMoveReason(e.target.value)} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Contoh: Beli rumah baru di Blok B"></textarea>
              </div>

              <div className="mt-6 flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsMoveModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-2">
                  <CheckCircleIcon className="w-5 h-5"/> Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
