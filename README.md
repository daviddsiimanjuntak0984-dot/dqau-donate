# Dqau Donate

Website donasi dan platform apresiasi karya bagi para kreator Indonesia, ditulis ulang menggunakan **React**, **TypeScript**, dan **Vite** dengan autentikasi **Supabase**.

## Fitur Utama

- **Navigasi & Status Akun**: Menampilkan status login pengguna (email) serta tombol Masuk / Daftar / Keluar.
- **Hero Banner**: Desain gradien ungu khas kreator dengan tombol jelajah.
- **Pencarian Kreator**: Pencarian nama tampilan, username, dan bio dengan debounce.
- **Kartu Kreator**: Daftar profil nyata dari database dengan halaman detail berbasis URL.
- **Kanal Komunitas**: Tautan ke platform komunitas populer kreator (Discord, YouTube, Twitch, TikTok, Instagram, Facebook, Telegram, WhatsApp).
- **Bantuan & FAQ**: Informasi pengaturan akun, profil, avatar, dan status donasi.
- **Modal Autentikasi Supabase**:
  - Pendaftaran & login dengan email dan kata sandi.
  - Opsi login sosial (Google, Facebook, TikTok).
  - Autentikasi nomor HP via OTP SMS.
  - Penanganan pesan status dan kesalahan dalam bahasa Indonesia.

## Menjalankan Proyek

```bash
# Instal dependensi
npm install

# Jalankan server pengembangan
npm run dev

# Membangun untuk produksi
npm run build
```


## Konfigurasi Supabase

1. Buat atau pilih proyek Supabase.
2. Salin Project URL dan **publishable/anon key** ke file lokal `.env` berdasarkan `.env.example`. Jangan pernah memasukkan `service_role` atau secret key ke aplikasi browser.
3. Jalankan migrasi SQL yang tersedia di folder `migrations/` melalui Supabase SQL Editor atau Supabase CLI.
4. Aktifkan metode autentikasi yang benar-benar sudah dikonfigurasi di Supabase Authentication. Google/Facebook memerlukan kredensial provider; OTP HP memerlukan penyedia SMS. TikTok tidak didukung oleh semua konfigurasi Supabase Auth dan perlu diverifikasi sebelum ditampilkan sebagai opsi aktif.
5. Buat bucket Storage bernama `avatars`. Jika menggunakan bucket publik untuk menampilkan foto, pastikan kebijakan upload membatasi pengguna terautentikasi ke folder miliknya sendiri (misalnya awalan folder `auth.uid()`). Jangan memberi izin upload publik tanpa autentikasi.
6. Set `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di environment lokal dan hosting.

## Build dan deployment

```bash
npm install
npm run build
npm run preview
```

Untuk Vercel atau Netlify, impor repository, gunakan perintah build `npm run build` dan folder output `dist`. Tambahkan variabel environment Supabase pada pengaturan proyek hosting sebelum deployment. Setelah deploy, tambahkan URL website ke Supabase Authentication URL Configuration (Site URL dan Redirect URLs).

## Status fitur

- Autentikasi email/kata sandi, daftar profil kreator, penyuntingan profil, pencarian, dan upload avatar menggunakan Supabase tersedia setelah proyek serta kebijakan RLS/Storage dikonfigurasi dengan benar.
- Pembayaran/donasi, pencairan dana, serta album dan postingan belum aktif; jangan gunakan website ini untuk mengirim uang sebelum integrasi pembayaran tepercaya tersedia.
- Animasi menghormati preferensi `prefers-reduced-motion`; dialog mendukung Escape dan pengurungan fokus dasar.
