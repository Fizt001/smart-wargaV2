"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PrintSuratPage() {
  const params = useParams();
  const router = useRouter();
  const [letter, setLetter] = useState<any>(null);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLetter = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`http://localhost:8000/api/letters`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          // Find the specific letter from the list
          const found = data.data?.find((l: any) => l.id.toString() === params.id);
          if (found && found.status === 'approved') {
            setLetter(found);
            // Trigger print after rendering
            setTimeout(() => {
              window.print();
            }, 500);
          } else {
            toast.error("Surat tidak ditemukan atau belum disetujui.");
            router.push('/dashboard/surat');
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Terjadi kesalahan saat memuat data cetak.");
      }
    };
    
    const fetchConfig = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/public/app-config`);
        if (res.ok) {
          const data = await res.json();
          setAppConfig(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch app config", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      Promise.all([fetchLetter(), fetchConfig()]);
    } else {
      setIsLoading(false);
    }
  }, [params.id, router]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-slate-500">Menyiapkan dokumen cetak...</div>;
  }

  if (!letter) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-red-500">Dokumen tidak dapat dicetak.</div>;
  }

  const currentDate = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="bg-white min-h-screen text-black p-8 font-serif max-w-4xl mx-auto">
      {/* Hide elements when printing isn't active to keep clean layout but we'll use regular tailwind, print: classes */}
      <div className="print:hidden mb-4 flex justify-end space-x-4">
        <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded font-sans">Cetak Ulang</button>
        <button onClick={() => window.close()} className="px-4 py-2 bg-slate-200 text-slate-700 rounded font-sans">Tutup Halaman</button>
      </div>

      {/* KOP SURAT */}
      <div className="border-b-4 border-black pb-4 mb-8 text-center">
        <h1 className="text-xl font-bold uppercase tracking-wider">Rukun Tetangga (RT) {letter.user?.rt_id}</h1>
        <h2 className="text-2xl font-bold uppercase tracking-wide">{appConfig?.rw_name || 'Perumahan BTR'}</h2>
        <p className="text-sm mt-1">Sekretariat: {appConfig?.rw_name || 'Perumahan BTR'}</p>
      </div>

      {/* JUDUL SURAT */}
      <div className="text-center mb-8">
        <h4 className="text-xl font-bold uppercase underline decoration-2">{letter.letter_type?.name}</h4>
        <p className="text-sm mt-1">Nomor: {letter.letter_number} / RT.{letter.user?.rt_id} / {new Date().getFullYear()}</p>
      </div>

      {/* ISI SURAT */}
      <div className="space-y-6 leading-relaxed text-justify">
        <p>Yang bertanda tangan di bawah ini Ketua RT {letter.user?.rt_id} {appConfig?.rw_name || 'Perumahan BTR'}, dengan ini menerangkan bahwa:</p>
        
        <table className="w-full ml-8">
          <tbody>
            <tr>
              <td className="w-48 py-1">Nama Lengkap</td>
              <td className="w-4 py-1">:</td>
              <td className="font-bold py-1 uppercase">{letter.user?.name}</td>
            </tr>
            <tr>
              <td className="py-1">Nomor Induk Kependudukan</td>
              <td className="py-1">:</td>
              <td className="py-1">{letter.user?.nik || '-'}</td>
            </tr>
            <tr>
              <td className="py-1">Alamat</td>
              <td className="py-1">:</td>
              <td className="py-1">{appConfig?.rw_name || 'Perumahan BTR'}, Blok {letter.user?.house_number || '-'}, RT {letter.user?.rt_id}</td>
            </tr>
            <tr>
              <td className="py-1">Agama</td>
              <td className="py-1">:</td>
              <td className="py-1">{letter.user?.religion_id ? 'Tercatat' : '-'}</td>
            </tr>
            <tr>
              <td className="py-1">Nomor HP / Telp</td>
              <td className="py-1">:</td>
              <td className="py-1">{letter.user?.phone_number || '-'}</td>
            </tr>
          </tbody>
        </table>

        <p>Orang tersebut di atas benar-benar warga kami yang berdomisili di alamat tersebut. Surat keterangan ini dibuat untuk keperluan:</p>
        
        <div className="p-4 border border-slate-300 bg-slate-50 italic">
          "{letter.notes}"
        </div>

        <p>Demikian surat keterangan ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya oleh pihak yang berkepentingan.</p>
      </div>

      {/* TANDA TANGAN */}
      <div className="mt-16 flex justify-between items-end">
        <div className="text-center w-64">
          <p className="mb-20">Pemohon,</p>
          <p className="font-bold underline uppercase">{letter.user?.name}</p>
        </div>
        <div className="text-center w-64">
          <p className="mb-1">{appConfig?.app_name || 'BTR'}, {currentDate}</p>
          <p className="mb-20">Ketua RT {letter.user?.rt_id},</p>
          <p className="font-bold underline uppercase">( ........................................ )</p>
        </div>
      </div>
      
      {/* Jika butuh RW Approval, tambahkan form TTD RW */}
      {letter.letter_type?.requires_rw_approval && (
        <div className="mt-16 flex justify-center items-end">
          <div className="text-center w-64">
            <p className="mb-1">Mengetahui,</p>
            <p className="mb-20">Ketua RW 01,</p>
            <p className="font-bold underline uppercase">( ........................................ )</p>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background-color: white; }
          .print\\:hidden { display: none !important; }
          @page { margin: 2cm; }
        }
      `}} />
    </div>
  );
}
