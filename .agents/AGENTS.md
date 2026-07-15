# SmartWarga-BTR Role & Workflow Binding

## Role Binding
- **Warga (End-User):** Request, Submit (upload proof). NO validation/status change.
- **Ketua RT:** ACC/Tolak (warga baru, surat pengantar). No finance/inventory.
- **Ketua RW:** Viewer Global, ACC Final (large events/emergency funds).
- **Sekretaris:** Manage Buku Induk, Print Surat, manage Kalender, manage Aset. No finance.
- **Bendahara:** Verifikasi Pembayaran (IPL/mutasi), mark Lunas, record Pengeluaran. No surat.
- **Kader Posyandu:** Input health data. RT/RW view, Sekre sync to calendar.
- **Satpam:** Input patrol/absensi. RT ACC schedule & view log, Bendahara process honor.
- **Bank Sampah:** Input saldo, manage UMKM. RT ACC UMKM lapak, Bendahara ACC IPL deduction.

## Workflow Logic
- **IPL & Kas:** Warga Submit -> Bendahara Validasi.
- **Pendaftaran Warga:** Warga Form -> Sekre Cek Dokumen -> RT ACC.
- **Surat:** Warga Ajukan -> RT Verifikasi -> Sekre Cetak.
- **Musibah:** Warga Lapor -> Broadcast -> RT Instruct -> Bendahara Catat & Santun.
