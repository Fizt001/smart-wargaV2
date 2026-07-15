"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  XMarkIcon,
  InformationCircleIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import withSwal from "sweetalert2-react-content";
import Swal from "sweetalert2";

const MySwal = withSwal(Swal);

// Variabel bawaan yang selalu tersedia dari profil warga
const SYSTEM_VARIABLES = [
  { key: "nama_lengkap", label: "Nama Lengkap Warga" },
  { key: "nik", label: "NIK Warga" },
  { key: "alamat", label: "Alamat / Blok Rumah" },
  { key: "rt", label: "Nama RT" },
  { key: "tanggal_surat", label: "Tanggal Surat Dibuat" },
  { key: "no_surat", label: "Nomor Surat" },
];

export default function MasterSuratPage() {
  const [types, setTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View state: 'list' | 'template'
  const [view, setView] = useState<"list" | "template">("list");
  const [selectedType, setSelectedType] = useState<any>(null);

  // Modal Tambah/Edit Jenis Surat
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    requires_rw_approval: false,
  });

  // Template editor state
  const [templateBody, setTemplateBody] = useState("");
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  const [newVar, setNewVar] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchTypes = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiUrl}/api/letter-types`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setTypes(data.data || []);
      else toast.error("Gagal mengambil data jenis surat.");
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  // ─── CRUD Jenis Surat ───────────────────────────────────────────────────────

  const handleOpenModal = (data: any = null) => {
    setEditData(data);
    setFormData(
      data
        ? { name: data.name, requires_rw_approval: data.requires_rw_approval }
        : { name: "", requires_rw_approval: false }
    );
    setShowModal(true);
  };

  const handleSubmitType = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const url = editData
        ? `${apiUrl}/api/letter-types/${editData.id}`
        : `${apiUrl}/api/letter-types`;
      const method = editData ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Berhasil disimpan!");
        setShowModal(false);
        fetchTypes();
      } else {
        toast.error(data.message || "Gagal menyimpan data.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleDelete = async (id: number) => {
    const result = await MySwal.fire({
      title: "Hapus Jenis Surat?",
      text: "Jenis surat yang sudah pernah digunakan tidak bisa dihapus.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiUrl}/api/letter-types/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Berhasil dihapus!");
        fetchTypes();
      } else {
        toast.error(data.message || "Gagal menghapus.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  // ─── Template Editor ────────────────────────────────────────────────────────

  const openTemplateEditor = async (type: any) => {
    setSelectedType(type);
    setTemplateBody(type.template_body || "");
    try {
      const parsed = type.template_variables
        ? JSON.parse(type.template_variables)
        : [];
      setTemplateVariables(Array.isArray(parsed) ? parsed : []);
    } catch {
      setTemplateVariables([]);
    }
    setView("template");
  };

  const insertVariable = (varKey: string) => {
    const placeholder = `{{${varKey}}}`;
    setTemplateBody((prev) => prev + placeholder);
  };

  const addCustomVar = () => {
    const cleaned = newVar.trim().toLowerCase().replace(/\s+/g, "_");
    if (!cleaned) return;
    if (templateVariables.includes(cleaned)) {
      toast.error("Variabel sudah ada.");
      return;
    }
    setTemplateVariables((prev) => [...prev, cleaned]);
    setNewVar("");
  };

  const removeVar = (v: string) => {
    setTemplateVariables((prev) => prev.filter((x) => x !== v));
    // juga hapus dari template body
    setTemplateBody((prev) => prev.replaceAll(`{{${v}}}`, ""));
  };

  const handleSaveTemplate = async () => {
    setIsSavingTemplate(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${apiUrl}/api/letter-types/${selectedType.id}/template`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            template_body: templateBody,
            template_variables: JSON.stringify(templateVariables),
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("Template berhasil disimpan!");
        // update local list
        setTypes((prev) =>
          prev.map((t) =>
            t.id === selectedType.id
              ? {
                  ...t,
                  template_body: templateBody,
                  template_variables: JSON.stringify(templateVariables),
                }
              : t
          )
        );
        setSelectedType((prev: any) => ({
          ...prev,
          template_body: templateBody,
          template_variables: JSON.stringify(templateVariables),
        }));
      } else {
        toast.error(data.message || "Gagal menyimpan template.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (view === "template" && selectedType) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <button
            onClick={() => setView("list")}
            className="hover:text-blue-600 font-medium transition-colors"
          >
            Master Jenis Surat
          </button>
          <ChevronRightIcon className="w-4 h-4" />
          <span className="font-semibold text-slate-800">
            Template: {selectedType.name}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel Kiri: Variabel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <CodeBracketIcon className="w-5 h-5 text-indigo-500" />
                  Variabel Tersedia
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Klik untuk sisipkan ke template
                </p>
              </div>

              {/* Variabel sistem */}
              <div className="p-4 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">
                  Sistem (Otomatis)
                </p>
                {SYSTEM_VARIABLES.map((sv) => (
                  <button
                    key={sv.key}
                    onClick={() => insertVariable(sv.key)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors group"
                  >
                    <code className="text-xs font-mono text-indigo-600 group-hover:text-indigo-800">
                      {`{{${sv.key}}}`}
                    </code>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {sv.label}
                    </p>
                  </button>
                ))}

                {/* Variabel custom (tambahan form) */}
                {templateVariables.length > 0 && (
                  <>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 mt-4">
                      Variabel Tambahan
                    </p>
                    {templateVariables.map((v) => (
                      <div key={v} className="flex items-center gap-1">
                        <button
                          onClick={() => insertVariable(v)}
                          className="flex-1 text-left px-3 py-2 rounded-lg hover:bg-amber-50 hover:text-amber-700 transition-colors"
                        >
                          <code className="text-xs font-mono text-amber-600">
                            {`{{${v}}}`}
                          </code>
                        </button>
                        <button
                          onClick={() => removeVar(v)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <XMarkIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* Tambah variabel baru */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">
                    Tambah Variabel Baru
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={newVar}
                      onChange={(e) => setNewVar(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomVar()}
                      placeholder="nama_variabel"
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                    />
                    <button
                      onClick={addCustomVar}
                      className="px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Gunakan underscore, contoh: keperluan_surat
                  </p>
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex gap-2">
                <InformationCircleIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-blue-800 mb-1">
                    Cara Kerja Template
                  </p>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    Tulis isi surat menggunakan variabel{" "}
                    <code className="bg-blue-100 px-1 rounded">
                      {"{{nama_variabel}}"}
                    </code>
                    . Saat warga mencetak surat, variabel sistem akan otomatis
                    terisi dari profilnya. Variabel tambahan akan diminta diisi
                    oleh warga saat mengajukan surat.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Kanan: Editor */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                    Isi Template Surat
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tulis isi/kalimat surat lengkap. Variabel akan diganti
                    otomatis saat dicetak.
                  </p>
                </div>
                <button
                  onClick={handleSaveTemplate}
                  disabled={isSavingTemplate}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  {isSavingTemplate ? "Menyimpan..." : "Simpan Template"}
                </button>
              </div>

              <div className="p-5">
                <textarea
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  placeholder={`Contoh:\n\nSurat Keterangan Domisili\n\nYang bertanda tangan di bawah ini, Ketua RT {{rt}}, menerangkan bahwa:\n\nNama\t: {{nama_lengkap}}\nNIK\t: {{nik}}\nAlamat\t: {{alamat}}\n\nadalah benar-benar warga yang berdomisili di wilayah RT kami.\n\nDemikian surat keterangan ini dibuat untuk keperluan {{keperluan_surat}}.`}
                  rows={20}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed resize-y bg-slate-50 focus:bg-white transition-colors"
                />
                <div className="mt-3 flex justify-between items-center text-xs text-slate-400">
                  <span>{templateBody.length} karakter</span>
                  <span>
                    {(templateBody.match(/\{\{[^}]+\}\}/g) || []).length} variabel
                    digunakan
                  </span>
                </div>
              </div>
            </div>

            {/* Preview */}
            {templateBody && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-amber-50">
                  <h3 className="font-bold text-amber-800 text-sm">
                    Preview Template (tanpa substitusi)
                  </h3>
                </div>
                <pre className="p-5 text-sm text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                  {templateBody}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── List View ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Master Jenis Surat
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola jenis surat beserta template kalimatnya.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Tambah Jenis Surat</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Memuat data...</div>
        ) : types.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-500">
            <DocumentTextIcon className="w-16 h-16 text-slate-200 mb-4" />
            <p>Belum ada jenis surat yang ditambahkan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">Nama Jenis Surat</th>
                  <th className="px-6 py-4 text-center">Butuh Persetujuan RW?</th>
                  <th className="px-6 py-4 text-center">Template</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {types.map((type, index) => (
                  <tr
                    key={type.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">{index + 1}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {type.name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {type.requires_rw_approval ? (
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                          Ya
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                          Tidak (Cukup RT)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {type.template_body ? (
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                          ✓ Ada Template
                        </span>
                      ) : (
                        <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">
                          Belum Ada
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openTemplateEditor(type)}
                          className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                          title="Edit Template"
                        >
                          <CodeBracketIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(type)}
                          className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit Info"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(type.id)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit Jenis Surat */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                {editData ? "Edit Jenis Surat" : "Tambah Jenis Surat"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitType} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Nama Jenis Surat
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                  placeholder="Contoh: Surat Keterangan Domisili"
                />
              </div>
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <input
                  type="checkbox"
                  id="requires_rw"
                  checked={formData.requires_rw_approval}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requires_rw_approval: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded text-purple-600"
                />
                <label
                  htmlFor="requires_rw"
                  className="text-sm font-semibold text-purple-800 cursor-pointer"
                >
                  Perlu persetujuan dari Ketua RW
                </label>
              </div>
              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full px-4 py-3 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full px-4 py-3 text-white font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
