# SANJARA Hadir — SMP SSA Negeri Jenggrong Ranuyoso

Aplikasi absensi siswa berbasis QR. Salinan kode sumber versi terbaru dari aplikasi Sites, 7 Oktober 2026.

## Fitur
- Scan QR berulang, identitas siswa, pemeriksaan radius lokasi sekolah, dan pencegahan absensi ganda.
- Data siswa: NIPD, NISN, nama, jenis kelamin, kelas. Impor Excel/CSV dan edit siswa.
- Kartu siswa dua sisi dengan logo sekolah dan QR unik. Unduh PNG dan cetak/PDF.
- Surat izin otomatis: formulir orang tua/wali, tanggal, alasan, keterangan, dan QR verifikasi dokumen.
- Status Izin tersimpan bersama surat. Surat dapat dilihat dan dicetak.
- Rekap bulanan dan detail harian dalam CSV untuk Excel.

## Platform dan batasan
Kode ini menggunakan React, Vinext, Cloudflare Workers, D1, R2, dan Drizzle. Ini **bukan paket Next.js yang langsung siap dideploy di Vercel**. Migrasi ke Vercel membutuhkan penggantian akses D1/R2, konfigurasi runtime, dan autentikasi.

Di Sites, akses privat dilindungi platform. Untuk hosting mandiri, pasang autentikasi dan otorisasi pada semua halaman/API sebelum membuka akses ke data siswa. Koneksi Google Drive belum diaktifkan.

QR surat mengarah ke salinan surat; nama dan persetujuan orang tua/wali berasal dari formulir. QR tersebut tidak memverifikasi identitas orang tua secara independen.

## Isi paket
Kode sumber, aset sekolah, migrasi struktur database, pengujian, dan lockfile dependensi. Tidak berisi data siswa, catatan absensi, isi database, kredensial, atau node_modules. ID proyek Sites asal tidak disertakan dalam konfigurasi ekspor.

## Menjalankan secara lokal
Prasyarat: Node.js 22.13 atau lebih baru; gunakan versi pnpm sesuai packageManager di package.json.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Database lokal perlu diinisialisasi menggunakan migrasi dalam folder drizzle. Petunjuk konfigurasi dan perintah migrasi ada di README-STARTER.md. Konfigurasi D1/R2 lokal berada di vite.config.ts. Untuk produksi, siapkan sumber daya dan autentikasi sesuai penyedia hosting.

## Pemeriksaan dan build
```sh
pnpm exec tsc --noEmit
node --experimental-strip-types --test tests/*.test.mjs
pnpm build
```

Aplikasi aktif: https://sanjara-absensi.smpssanegerijenggron.chatgpt.site

Sumber versi Sites: b3999c79bdc070bbecc9368af7ee22562976d171.
