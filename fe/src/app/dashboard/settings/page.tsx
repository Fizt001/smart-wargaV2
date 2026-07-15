"use client";

import { useState, useEffect } from "react";
import { Cog6ToothIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any[]>([]);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [userRes, setRes] = await Promise.all([
        fetch(`${apiUrl}/api/user`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/settings`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const userData = await userRes.json();
      setUser(userData.data || userData);

      const setData = await setRes.json();
      
      const sets = setData.data || [];
      setSettings(sets);
      
      // Initialize form values
      const initialValues: Record<string, any> = {};
      sets.forEach((s: any) => {
        initialValues[s.key] = s.value;
      });
      setFormValues(initialValues);

    } catch (error) {
      toast.error("Gagal memuat pengaturan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/settings/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ settings: formValues })
      });

      const data = await res.json();
      if (data.status === "success") {
        toast.success("Pengaturan berhasil disimpan!");
      } else {
        toast.error("Gagal menyimpan pengaturan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const handleChange = (key: string, value: any) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  if (!user || user.role_id >= 8) {
    return <div className="p-10 text-center text-slate-500">Anda tidak memiliki akses ke halaman ini.</div>;
  }

  // Group settings
  const groups = [...new Set(settings.map(s => s.group))];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
          <Cog6ToothIcon className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pengaturan Sistem</h1>
          <p className="text-slate-500">Konfigurasi dinamis SIP-BTR untuk Admin RW.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500">Memuat pengaturan...</div>
        ) : (
          <form onSubmit={handleSave} className="p-6">
            <div className="space-y-8">
              {groups.map((group) => (
                <div key={group as string}>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 uppercase tracking-wider border-b pb-2">{group as string}</h3>
                  <div className="space-y-4 max-w-2xl">
                    {settings.filter(s => s.group === group).map(setting => (
                      <div key={setting.id} className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-sm font-medium text-slate-700 col-span-1">{setting.label || setting.key}</label>
                        <div className="col-span-2">
                          {setting.type === 'boolean' ? (
                            <select 
                              value={formValues[setting.key]} 
                              onChange={(e) => handleChange(setting.key, e.target.value)}
                              className="w-full border-slate-200 rounded-xl focus:ring-slate-900 focus:border-slate-900"
                            >
                              <option value="1">Aktif (True)</option>
                              <option value="0">Nonaktif (False)</option>
                            </select>
                          ) : (
                            <input 
                              type={setting.type === 'integer' ? 'number' : 'text'}
                              value={formValues[setting.key] || ""} 
                              onChange={(e) => handleChange(setting.key, e.target.value)}
                              className="w-full border-slate-200 rounded-xl focus:ring-slate-900 focus:border-slate-900"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
              <button type="submit" className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-medium rounded-xl shadow-md transition-colors flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5" />
                Simpan Perubahan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
