# SANJARA Hadir — Vercel Edition

Absensi QR SMP SSA Negeri Jenggrong Ranuyoso. Next.js 16, React, Neon PostgreSQL dan Drizzle. Mendukung lokasi sekolah, impor siswa, kartu ID dua sisi, surat izin otomatis dan unduh rekap CSV. Logo dan desain sekolah tetap digunakan.

## Pengaturan Vercel

1. Import repository `smpssanegerijenggrong-cmyk/absensi-ssanjenggrong`.
2. Root Directory: akar repo. Framework: **Next.js**. Install: `npm ci`. Build: `npm run build`. Output Directory: biarkan default Next.js, hapus override `dist` bila pernah diisi. Gunakan Node.js **22.x** atau **24.x**.
3. Hubungkan database **Neon PostgreSQL** dari Vercel Marketplace/Storage ke proyek. Pastikan `DATABASE_URL` tersedia.
4. Tambahkan `ADMIN_PASSWORD` (minimal 16 karakter, kata sandi operator) dan `AUTH_SECRET` (acak, minimal 32 karakter) di Settings → Environment Variables. Jangan pakai prefix `NEXT_PUBLIC_`.
5. Buat struktur database melalui SQL Editor Neon dengan isi `migrations/0001_postgres.sql`. Alternatif: setelah proyek tertaut dan env ditarik ke `.env.local`, jalankan `npm run db:migrate`.
6. Redeploy. Masuk memakai kata sandi operator, tambah/impor siswa, lalu atur lokasi sekolah.

Untuk membuat secret acak di komputer sendiri: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. Simpan hasilnya hanya dalam Environment Variables. Jangan commit kredensial ke repo.

Jika env belum lengkap, halaman login menampilkan petunjuk penyiapan. Build tidak memerlukan kredensial dan tidak menjalankan migrasi. Database dan login diperlukan untuk menggunakan aplikasi. Pisahkan database Production dan Preview bila menggunakan keduanya.

## Menjalankan lokal setelah konfigurasi

```sh
npm ci
# Hubungkan proyek Vercel, tarik env ke .env.local, lalu:
npm run db:migrate
npm run dev
```

## Verifikasi kode

```sh
npm run test
npm run typecheck
npm run build
```

## Keamanan dan data

- Semua API siswa, absensi, surat dan halaman utama memerlukan sesi operator. Cookie ditandatangani, httpOnly, SameSite=Lax dan Secure pada production; sesi berlaku 8 jam.
- Percobaan login dibatasi melalui database. Perubahan kata sandi/secret membatalkan sesi lama.
- Catatan izin dan isi surat disimpan bersama di PostgreSQL. QR surat membuka salinan tersimpan setelah login; bukan verifikasi identitas orang tua.
- Tidak menggunakan filesystem lokal atau localStorage untuk database siswa.
- Logo/kartu adalah aset statis. Surat baru dibuat dari database dan bisa dicetak/disimpan PDF; tidak membutuhkan R2.
- Backup Google Drive belum aktif.

## Pemindahan dari Sites

Repository ini mengganti runtime Cloudflare/Vinext dengan Next.js Node.js. Data siswa, kehadiran dan lampiran di aplikasi Sites **tidak otomatis berpindah**. Aplikasi Sites asal tetap terpisah. Ekspor/impor siswa tersedia; pemindahan riwayat absensi dan lampiran lama memerlukan migrasi data tersendiri. Jangan menerapkan SQL SQLite lama pada Neon.

Versi ini tidak memerlukan akun ChatGPT untuk login, tetapi hanya ditujukan untuk guru/operator yang memiliki kata sandi. Jangan membagikan kata sandi operator kepada siswa/orang tua.
