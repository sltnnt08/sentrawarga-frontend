# SentraWarga Frontend

Frontend ini adalah tampilan website SentraWarga yang dipakai warga dan admin.
Di sini pengguna bisa daftar, login, kirim laporan, dan melihat status laporan.

Dokumen ini dibuat dengan bahasa sederhana supaya mudah diikuti.

## 1. Gambaran Fitur

Fitur utama yang sudah ada:

- Landing page informasi SentraWarga.
- Login dan daftar akun (email/password + Google).
- Verifikasi email dan reset password.
- Upload laporan warga (judul, deskripsi, kategori, prioritas, lokasi, foto opsional).
- Bantuan AI untuk saran kategori laporan sebelum dikirim.
- Halaman "Laporan Saya" untuk melihat, edit, atau tarik laporan sendiri.
- Dashboard admin dengan peta Leaflet + OpenStreetMap.
- Visual kepadatan kasus di peta dengan warna risiko (rendah sampai kritis).

## 2. Teknologi yang Dipakai

- React + TypeScript
- Vite
- Tailwind + komponen UI
- React Query
- React Router
- Leaflet + React Leaflet
- Vitest

## 3. Struktur Folder Penting

- `src/App.tsx`: daftar route halaman.
- `src/pages`: halaman utama aplikasi.
- `src/components`: komponen UI dan route guard.
- `src/lib/api.ts`: fungsi panggil API backend.
- `src/lib/api-config.ts`: aturan base URL backend.
- `vite.config.ts`: konfigurasi dev server + proxy.

## 4. Route Halaman Utama

Route publik:

- `/` (beranda)
- `/masuk`
- `/daftar`
- `/lupa-password`
- `/verifikasi-email`
- `/reset-password`

Route pengguna login:

- `/lapor`
- `/laporan-saya`

Route khusus admin:

- `/admin`

## 5. Cara Menjalankan Lokal

1) Masuk ke folder frontend.

2) Install dependency:

```bash
npm ci
```

3) Buat file environment:

```bash
cp .env.example .env
```

4) Pastikan nilai penting di `.env`:

- `VITE_API_BASE_URL=/api`
- `VITE_GOOGLE_CLIENT_ID=` (opsional, isi jika fitur Google login dipakai)

5) Jalankan frontend:

```bash
npm run dev
```

Default frontend berjalan di `http://localhost:8080`.

Catatan koneksi backend lokal:

- Vite sudah menyiapkan proxy `/api` ke `http://localhost:3000`.
- Jadi untuk mode lokal, backend cukup jalan di port 3000.

## 6. Cara Build dan Test

Build production:

```bash
npm run build
```

Preview hasil build:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

Test:

```bash
npm run test
```

Mode watch test:

```bash
npm run test:watch
```

## 7. Integrasi API

Frontend mengambil data dari backend SentraWarga melalui endpoint `/api/*`.

Contoh endpoint yang dipakai frontend:

- Auth: `/api/auth/*`
- Reports: `/api/reports/*`
- Notifications: `/api/notifications/*`
- Wilayah: `/api/wilayah/*`

Konfigurasi default API:

- Lokal: `/api` (melewati proxy Vite)
- Non-lokal: fallback ke `https://sentrawarga-backend.onrender.com/api` jika `VITE_API_BASE_URL` tidak diisi

## 8. Catatan Google Login

Google login aktif jika `VITE_GOOGLE_CLIENT_ID` valid.

Jika nilai ini kosong atau tidak valid, aplikasi tetap berjalan normal, hanya tombol/alur Google yang tidak aktif penuh.

## 9. Catatan Peta Dashboard Admin

Dashboard admin memakai:

- Leaflet + OpenStreetMap
- Marker kepadatan kasus berdasarkan koordinat laporan
- Warna risiko:
  - Rendah: hijau
  - Waspada: kuning
  - Tinggi: oranye
  - Kritis: merah

Admin juga bisa ganti tema tile peta (OpenStreetMap default atau Humanitarian).

## 10. Troubleshooting Singkat

Jika data tidak muncul di frontend:

- Pastikan backend jalan di port 3000.
- Cek `VITE_API_BASE_URL`.
- Cek endpoint `http://localhost:3000/healthz`.

Jika login Google gagal:

- Cek `VITE_GOOGLE_CLIENT_ID` di frontend.
- Cek `GOOGLE_CLIENT_ID` dan konfigurasi Google auth di backend.

Jika upload laporan gagal:

- Cek ukuran/format gambar.
- Cek backend env untuk Supabase Storage jika upload file dipakai.
