<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    private function checkAndSeedDefaults()
    {
        if (Setting::count() === 0) {
            $defaults = [
                ['key' => 'app_name', 'value' => 'SIP-BTR', 'type' => 'string', 'group' => 'general', 'label' => 'Nama Aplikasi'],
                ['key' => 'rw_name', 'value' => 'Perumahan BTR', 'type' => 'string', 'group' => 'general', 'label' => 'Nama Lingkungan'],
                ['key' => 'app_description', 'value' => 'Platform digital pintar untuk tata kelola lingkungan, transparansi, dan kolaborasi warga.', 'type' => 'string', 'group' => 'general', 'label' => 'Deskripsi Aplikasi'],
                ['key' => 'contact_email', 'value' => 'admin@sip.com', 'type' => 'string', 'group' => 'contact', 'label' => 'Email Pengurus RW'],
                ['key' => 'enable_umkm', 'value' => '1', 'type' => 'boolean', 'group' => 'features', 'label' => 'Aktifkan Modul UMKM'],
            ];
            foreach ($defaults as $def) {
                Setting::create($def);
            }
        }
    }

    public function index()
    {
        $this->checkAndSeedDefaults();
        $settings = Setting::all();

        return response()->json([
            'status' => 'success',
            'data' => $settings
        ]);
    }

    public function updateBulk(Request $request)
    {
        $settings = $request->settings; // Array of [id => value] atau [key => value]

        foreach ($settings as $key => $value) {
            Setting::where('key', $key)->update(['value' => $value]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Pengaturan berhasil diperbarui'
        ]);
    }

    public function getPublicConfig()
    {
        $this->checkAndSeedDefaults();
        $settings = Setting::whereIn('key', ['app_name', 'rw_name', 'app_description'])->get();
        $config = [];
        foreach($settings as $s) {
            $config[$s->key] = $s->value;
        }
        return response()->json([
            'status' => 'success',
            'data' => $config
        ]);
    }
}
