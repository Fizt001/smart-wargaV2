"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface LetterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  letter?: any;
  onSave: (data: any) => Promise<void>;
  types: any[];
  isAdmin: boolean;
}

export default function LetterFormModal({ isOpen, onClose, letter, onSave, types, isAdmin }: LetterFormModalProps) {
  const [formData, setFormData] = useState({
    letter_type_id: "",
    notes: "",
    status: "pending",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (letter) {
      setFormData({
        letter_type_id: letter.letter_type_id?.toString() || "",
        notes: letter.notes || "",
        status: letter.status || "pending",
      });
    } else {
      setFormData({
        letter_type_id: "",
        notes: "",
        status: "pending",
      });
    }
  }, [letter, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
                    {letter ? (isAdmin ? "Ubah Status Surat" : "Detail Surat") : "Ajukan Surat Pengantar"}
                  </Dialog.Title>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Surat</label>
                    <select
                      name="letter_type_id"
                      required
                      disabled={!!letter}
                      value={formData.letter_type_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-70 disabled:bg-slate-100"
                    >
                      <option value="">Pilih Jenis Surat</option>
                      {types.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Keperluan / Keterangan</label>
                    <textarea
                      name="notes"
                      required
                      disabled={!!letter && !isAdmin}
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none disabled:opacity-70 disabled:bg-slate-100"
                      placeholder="Contoh: Untuk melamar pekerjaan..."
                    />
                  </div>

                  {isAdmin && letter && (
                    <div className="pt-4 border-t border-slate-100 mt-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Ubah Status</label>
                      <select
                        name="status"
                        required
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="pending">Menunggu (Pending)</option>
                        <option value="approved">Disetujui (Approved)</option>
                        <option value="rejected">Ditolak (Rejected)</option>
                      </select>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Batal
                    </button>
                    {(!letter || isAdmin) && (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-70 flex items-center"
                      >
                        {isSubmitting ? "Menyimpan..." : (letter ? "Update Status" : "Ajukan Surat")}
                      </button>
                    )}
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
