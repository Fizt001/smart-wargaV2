"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  onSave: (data: any) => Promise<void>;
  roles: any[];
  religions: any[];
  maritalStatuses: any[];
  professions: any[];
  rts: any[];
  blocks: any[];
  userType?: "Warga" | "Pengurus";
}

export default function UserFormModal({ isOpen, onClose, user, onSave, roles, religions, maritalStatuses, professions, rts, blocks, userType = "Warga" }: UserFormModalProps) {
  const [formData, setFormData] = useState({
    nik: "",
    name: "",
    email: "",
    password: "",
    phone_number: "",
    role_id: "",
    rt_id: "",
    block_id: "",
    house_number: "",
    religion_id: "",
    marital_status_id: "",
    profession_category_id: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        nik: user.nik || "",
        name: user.name || "",
        email: user.email || "",
        password: "", // Kosongkan password saat edit
        phone_number: user.phone_number || "",
        role_id: user.role_id?.toString() || "",
        rt_id: user.rt_id?.toString() || "",
        block_id: user.block_id?.toString() || user.house?.block_id?.toString() || "",
        house_number: user.house?.number || user.house_number || "",
        religion_id: user.religion_id?.toString() || "",
        marital_status_id: user.marital_status_id?.toString() || "",
        profession_category_id: user.profession_category_id?.toString() || "",
      });
    } else {
      setFormData({
        nik: "",
        name: "",
        email: "",
        password: "",
        phone_number: "",
        role_id: roles[0]?.id?.toString() || "",
        rt_id: rts?.length === 1 ? rts[0].id.toString() : "",
        block_id: "",
        house_number: "",
        religion_id: "",
        marital_status_id: "",
        profession_category_id: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isOpen, roles?.length, rts?.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-5">
                  <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-slate-800">
                    {user ? `Edit Data ${userType}` : `Tambah ${userType} Baru`}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {formData.role_id !== "8" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">NIK</label>
                      <input
                        type="text"
                        name="nik"
                        value={formData.nik}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Masukkan NIK KTP"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder={formData.role_id === "8" ? "Nama Sesuai KTP" : "Nama Pengurus"}
                    />
                  </div>

                  {formData.role_id !== "8" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">No. HP</label>
                      <input
                        type="text"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="0812..."
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Peran (Role) *</label>
                      <select
                        name="role_id"
                        required
                        value={formData.role_id}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="">Pilih Peran</option>
                        {roles?.map((role) => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                    {["3", "6", "7", "8"].includes(formData.role_id) && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Wilayah RT *</label>
                        <select
                          name="rt_id"
                          required={formData.role_id !== "8"}
                          value={formData.rt_id}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        >
                          <option value="">Pilih RT</option>
                          {rts?.map((rt) => (
                            <option key={rt.id} value={rt.id}>{rt.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {formData.role_id === "8" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Blok Rumah</label>
                        <select
                          name="block_id"
                          value={formData.block_id}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        >
                          <option value="">Pilih Blok</option>
                          {blocks?.map((block) => (
                            <option key={block.id} value={block.id}>{block.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">No. Rumah</label>
                        <input
                          type="text"
                          name="house_number"
                          value={formData.house_number}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          placeholder="Contoh: 10"
                        />
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-4 mt-2">
                    <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Akses Aplikasi (Opsional)</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          placeholder="Email untuk login"
                        />
                      </div>
                      {formData.role_id !== "8" && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Password {user && <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>}
                            {!user && " *"}
                          </label>
                          <input
                            type="password"
                            name="password"
                            required={!user && formData.role_id !== "8"}
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Minimal 8 karakter"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-70 flex items-center"
                    >
                      {isSubmitting ? "Menyimpan..." : "Simpan Data"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
