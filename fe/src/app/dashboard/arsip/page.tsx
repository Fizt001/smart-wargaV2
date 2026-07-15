"use client";

import { useState, useEffect } from "react";
import { DocumentTextIcon, MagnifyingGlassIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

export default function ArsipSuratPage() {
  const [letters, setLetters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLetters = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:8000/api/letters", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        // Hanya ambil yang sudah approved
        const approvedLetters = (data.data || []).filter((l: any) => l.status === 'approved');
        setLetters(approvedLetters);
      } else {
        toast.error("Gagal mengambil data arsip.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, []);

  const filteredLetters = letters.filter(letter => {
    const query = searchQuery.toLowerCase();
    return (
      letter.letter_number?.toLowerCase().includes(query) ||
      letter.user?.name?.toLowerCase().includes(query) ||
      letter.letter_type?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Arsip Surat Menyurat</h1>
            <p className="text-slate-500 text-sm mt-1">
              Dokumen rekam jejak seluruh surat yang telah diterbitkan (Disetujui).
            </p>
          </div>
          <div className="w-full md:w-auto relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari arsip..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Memuat data arsip...</div>
          ) : filteredLetters.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-500">
              <DocumentTextIcon className="w-16 h-16 text-slate-200 mb-4" />
              <p>Belum ada arsip surat atau tidak ditemukan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Nomor Surat</th>
                    <th className="px-6 py-4">Nama Pemohon</th>
                    <th className="px-6 py-4">Jenis Surat</th>
                    <th className="px-6 py-4">Keterangan</th>
                    <th className="px-6 py-4">Tanggal ACC</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLetters.map((letter) => (
                    <tr key={letter.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{letter.letter_number}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{letter.user?.name}</p>
                        <p className="text-xs text-slate-500">RT {letter.user?.rt_id}</p>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">{letter.letter_type?.name}</td>
                      <td className="px-6 py-4 max-w-xs truncate" title={letter.notes}>{letter.notes}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(letter.updated_at).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4 text-center">
                        <a 
                          href={`/dashboard/surat/${letter.id}/print`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center space-x-1 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <PrinterIcon className="w-4 h-4" />
                          <span>Cetak Ulang</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
