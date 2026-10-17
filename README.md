# Dqau Donate

Dqau Donate adalah aplikasi React + TypeScript + Vite untuk menemukan kreator dan menampilkan profil publik, dengan autentikasi serta penyimpanan profil melalui Supabase. Fitur transaksi donasi belum diaktifkan; tombol **Dukung** saat ini hanya menampilkan informasi placeholder.

## Fitur saat ini

- Login dan pendaftaran email/kata sandi melalui Supabase Auth.
- Profil kreator dengan avatar, username, bio, deep link `?creator=username`, dan tampilan responsif terinspirasi profil sosial.
- Upload avatar ke bucket Storage `avatars` (maksimal 2MB; JPG/PNG/WebP).
- Pemeriksaan username, pencarian debounced, loading skeleton, modal keyboard-accessible, animasi dan `prefers-reduced-motion`.
- PWA manifest, service worker, aset ikon SVG, dan fallback offline.
- FAQ dan panduan deployment.

## Persyaratan

- Node.js 20 LTS atau versi yang didukung Vite 6.
- Proyek Supabase (untuk fitur autentikasi, profil, dan upload).

## Setup lokal

```bash
git clone https://github.com/daviddsiimanjuntak0984-dot/dqau-donate.git
cd dqau-donate
npm install
cp .env.example .env.local
npm run dev
```

Isi `.env.local` dengan URL proyek dan publishable/anon key Supabase. Variabel frontend yang tersedia:

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Ya untuk Supabase | Project URL dari Supabase Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Ya untuk Supabase | Publishable/anon key. Jangan gunakan `service_role`/secret key di browser. |
| `VITE_SUPABASE_REDIRECT_URL` | Opsional | URL callback OAuth lokal/produksi yang juga harus diizinkan pada Supabase Auth. |

## Konfigurasi Supabase

1. Buat proyek di Supabase dan salin Project URL serta publishable/anon key ke `.env.local`.
2. Jalankan migrasi SQL yang memang tersedia pada folder `migrations/` melalui SQL Editor atau Supabase CLI. Periksa isi migrasi sebelum menjalankannya dan pastikan skema `profiles` memiliki `id`, `username`, `display_name`, `bio`, `avatar_url`, dan `created_at`.
3. Buka **Authentication → URL Configuration**. Atur Site URL dan tambahkan Redirect URL untuk `http://localhost:3000/**` serta domain produksi.
4. Aktifkan email/password. OAuth Google/Facebook membutuhkan konfigurasi kredensial provider. OTP HP membutuhkan provider SMS. Tombol provider yang belum dikonfigurasi tidak akan berfungsi; TikTok bukan provider standar Supabase Auth dan perlu integrasi OAuth khusus yang diverifikasi.
5. Buka **Storage → New bucket**, buat bucket bernama `avatars`. Jika memilih bucket publik agar URL avatar bisa langsung ditampilkan, ingat bahwa file dapat dibaca publik; kebijakan upload tetap harus membatasi pengguna terautentikasi ke folder miliknya sendiri (misalnya folder pertama `auth.uid()`). Jangan izinkan upload anonim.
6. Pastikan RLS tabel `profiles` mengizinkan pembacaan profil publik yang memang ingin ditampilkan, dan hanya pemilik yang boleh membuat/mengubah profilnya. Periksa seluruh ekspresi policy sebelum produksi.

> Jangan pernah menaruh Supabase service-role key atau secret key pada variabel `VITE_*`. Variabel tersebut akan dibundel ke kode browser.

## Test dan build

```bash
npm install
npm run dev
npm run build
npm run preview
```

Perintah `npm ci` hanya dapat digunakan setelah `package-lock.json` dibuat/di-commit. Jika lockfile tersedia di branch kamu, gunakan `npm ci && npm run build`.

## Deploy ke Vercel

1. Impor repository di Vercel dan pilih framework Vite.
2. Build command: `npm run build`; output directory: `dist`.
3. Tambahkan `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, dan jika diperlukan `VITE_SUPABASE_REDIRECT_URL` pada Project Settings → Environment Variables.
4. Deploy, kemudian tambahkan domain HTTPS Vercel ke Supabase Auth → URL Configuration.
5. Uji login, upload avatar, deep link, serta service worker di domain produksi.

Netlify juga dapat digunakan dengan build command `npm run build`, publish directory `dist`, dan environment variables yang sama. Jika menambahkan route client-side baru, tambahkan rewrite ke `/index.html`; profil saat ini menggunakan query string.

## PWA dan Google Play (TWA)

Manifest memakai ikon PNG 192×192 dan 512×512 untuk instalasi, dengan ikon SVG sebagai sumber vektor. Sebelum listing Android/Google Play, periksa kembali hasil ikon di perangkat sasaran. Sebelum mengemas sebagai Trusted Web Activity (TWA), deploy aplikasi ke HTTPS, verifikasi manifest dan service worker di Chrome DevTools/Lighthouse, siapkan domain Digital Asset Links (`/.well-known/assetlinks.json`) dengan SHA-256 certificate fingerprint yang benar, lalu gunakan Bubblewrap untuk menghasilkan paket Android. Signing key dan fingerprint harus dijaga dan tidak boleh ditebak.

## Checklist uji manual

- [ ] Daftar dengan email dan kata sandi; bila konfirmasi email aktif, tampilkan/ikuti instruksi email.
- [ ] Login dan logout; editor memuat profil yang sudah tersimpan.
- [ ] Username unik menampilkan status tersedia/terpakai; tunggu debounce sebelum menyimpan.
- [ ] Upload avatar JPG/PNG/WebP di bawah 2MB ke bucket `avatars`; URL publik tersimpan pada `profiles.avatar_url`.
- [ ] Profil tersimpan muncul di daftar; pencarian memfilter nama, username, dan bio.
- [ ] Buka profil melalui kartu atau URL `?creator=username`; tab Tentang/Tautan/Postingan bekerja.
- [ ] Modal ditutup dengan Escape, fokus terkurung saat terbuka, dan fokus kembali setelah ditutup.
- [ ] Tombol Dukung hanya menampilkan placeholder dan tidak memproses transaksi.
- [ ] Animasi pembuka hanya tampil saat load awal dan dihormati `prefers-reduced-motion`.
- [ ] Service worker aktif pada HTTPS, aset statis tersimpan, dan halaman offline muncul tanpa jaringan.
- [ ] `npm run build` sukses tanpa error TypeScript.

## Batasan produksi

Donasi/pembayaran, pencairan dana, follow, postingan, dan tautan sosial per profil belum terintegrasi. Jangan mempublikasikan klaim bahwa transaksi aktif sebelum provider pembayaran tepercaya, validasi server/webhook, dan kontrol keamanan selesai.
