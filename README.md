# 🏘️ Sistem Informasi Perumahan Blok Erika (SIP-BTR)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-production_ready-success.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**SIP-BTR** adalah sebuah platform digital terpadu (ERP Mikro) yang dirancang khusus untuk memodernisasi tata kelola administrasi Rukun Tetangga (RT) dan Rukun Warga (RW) di lingkungan Perumahan Bumi Trimulyo. Sistem ini memfasilitasi komunikasi, administrasi, dan transparansi keuangan antara Pengurus dan Warga secara *real-time* dan *paperless*.

---

## 🏗️ Arsitektur Sistem (Decoupled Architecture)

Proyek ini dibangun menggunakan arsitektur modern **Decoupled Architecture** (Pemisahan antara Frontend dan Backend), yang memungkinkan skalabilitas tinggi, keamanan berlapis, dan pengalaman pengguna (*User Experience*) yang sangat cepat layaknya aplikasi *Native* di Smartphone.

1.  **Backend (Headless API):** Bertindak murni sebagai penyedia RESTful API pembuat respon JSON. Sepenuhnya terpisah dari antarmuka pengguna.
2.  **Frontend (SPA - Single Page Application):** Bertindak sebagai *Client* utama yang merender data secara dinamis tanpa *full page reload*.
3.  **Mobile-First Design:** Desain UI/UX mengadopsi gaya *Card Layout*, memastikan kenyamanan optimal saat diakses melalui *Smartphone* oleh Warga maupun Petugas Lapangan.

---

## 🛠️ Stack Teknologi (Tech Stack)

Sistem ini didukung oleh *framework* dan pustaka *open-source* terbaik di kelasnya:

### ⚙️ Backend
*   **Framework:** [Laravel 11 / 12](https://laravel.com/) (PHP) - Strict API Mode
*   **Database:** MySQL Server & Eloquent ORM
*   **Autentikasi:** Laravel Sanctum (Token-based Authentication)
*   **Routing:** RESTful API Design

### 💻 Frontend
*   **Framework:** [Next.js](https://nextjs.org/) (React & TypeScript) - App Router
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Utility-first framework)
*   **UI Components:** Headless UI & Radix UI (Unstyled, accessible components)
*   **Iconography:** Heroicons
*   **Notifications:** Sonner (Toast notifications)
*   **State Management:** React Hooks & Context API

---

## ✨ Fitur-Fitur Utama (Core Features)

Sistem ini memecahkan berbagai masalah birokrasi manual melalui modul-modul berikut:

1.  **👥 Manajemen Kependudukan & Demografi**
    *   Pencatatan Kartu Keluarga (KK) dan data warga secara rinci.
    *   Sistem *Mutasi Pindah Rumah* (Dalam RT, Lintas RT, Keluar Perumahan) secara digital yang terintegrasi otomatis dengan verifikasi Ketua RT.
2.  **💰 Modul Keuangan & Kas (IPL)**
    *   *Digital Wallet (Dompet Warga)*: Sistem saldo mandiri (Top-Up via bukti transfer).
    *   *Auto Billing*: Penagihan Iuran Pengelolaan Lingkungan (IPL) bulanan secara otomatis.
    *   Buku Kas RT/RW transparan dengan pembagian persentase dana secara otomatis ke tingkat RW.
3.  **📄 Persuratan Digital (Paperless)**
    *   Pengajuan Surat Pengantar oleh warga langsung dari *Smartphone*.
    *   Verifikasi berjenjang oleh Sekretaris RT / Ketua RT hingga RW tanpa dokumen fisik.
4.  **🏥 Posyandu & Kesehatan**
    *   Pemantauan tumbuh kembang Balita (Berat/Tinggi Badan & Lingkar Kepala).
    *   Pencatatan riwayat kesehatan Lansia (Tekanan Darah) oleh Kader langsung di lapangan.

---

## 🚀 Fitur Tambahan (Pengembangan Ekosistem)

Untuk menjadikan SIP-BTR sebagai *Super App* warga, modul ekspansi berikut turut disertakan:

*   **🔒 Layanan Keamanan & Siskamling:** Penjadwalan ronda, presensi, dan buku laporan insiden keamanan.
*   **♻️ Bank Sampah:** Modul penukaran saldo Rupiah dari penyetoran sampah warga.
*   **🤝 Rukun Kematian:** Pencatatan iuran duka cita dan penyaluran santunan dana kematian.
*   **📦 Manajemen Aset RW:** Sistem inventarisasi dan reservasi fasilitas publik (Tenda, Kursi, *Sound System*).
*   **🛒 Ekonomi & UMKM Warga:** Katalog *marketplace* mini untuk promosi usaha sesama warga.
*   **📢 Layanan Pengaduan (Ticketing):** Saluran pelaporan keluhan infrastruktur (lampu mati, jalan rusak) kepada pengurus.

---

## 👥 Aktor & Hak Akses (Multi-Role System)

Sistem ini mendukung hierarki kompleks dengan 8+ jenis *Role*, di antaranya:

*   **Super Admin:** Akses penuh ke *Master Data* dan seluruh konfigurasi sistem.
*   **Ketua/Sekretaris/Bendahara RW:** Rekapitulasi gabungan tingkat RW dan persetujuan surat akhir.
*   **Ketua/Sekretaris/Bendahara RT:** Manajemen data warga lokal, kas RT, dan tagihan IPL.
*   **Petugas Keamanan / Satpam:** Akses buku tamu dan rekap keamanan.
*   **Kader Posyandu:** Akses khusus rekam medis balita dan lansia.
*   **Warga:** Pengguna akhir yang mengajukan layanan, membayar iuran, dan memantau tagihan (UI Disesuaikan untuk pengguna awam).

---

## 🎨 Konsep UI/UX (Aturan Desain)

Proyek ini sangat mengedepankan estetika dan fungsionalitas UI:
*   **Glassmorphism:** Elemen transparan dengan *background blur*.
*   **Clean & Minimalist:** Skema warna didominasi Biru (*Primary*), Putih/Abu terang, dipadukan aksen Hijau & Merah yang lembut.
*   **Interaktif (Micro-interactions):** Setiap tombol, input, dan aksi memiliki transisi halus menggunakan *utility* dari Tailwind CSS.
*   **No Full-Page Reload:** Menggunakan *Modal Dialog* untuk setiap aksi CRUD demi menjaga esensi navigasi SPA (*Single Page Application*).

---

> *SIP-BTR: Mewujudkan Lingkungan yang Transparan, Cepat, dan Terintegrasi secara Digital.*
