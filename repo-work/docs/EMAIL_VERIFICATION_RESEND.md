# Verifikasi Email (Supabase Auth + Resend SMTP)

Status: **menunggu konfigurasi pemilik.** Kode aplikasi sudah siap; langkah di bawah perlu dilakukan sekali oleh pemilik proyek. Jangan kirim kredensial melalui chat atau commit.

## Yang sudah ada di aplikasi

- Pendaftaran email/password dengan pesan "periksa email untuk konfirmasi" (Bahasa Indonesia).
- Tombol **kirim ulang email konfirmasi** dengan cooldown 60 detik.
- Tombol **Lupa kata sandi** yang mengirim tautan reset via Supabase Auth.
- Pengguna yang belum mengonfirmasi email tidak dianggap sudah masuk.

## Langkah konfigurasi Supabase Auth (dashboard pemilik)

1. Buka Dashboard Supabase proyek → **Authentication → SMTP Settings** → enable **Custom SMTP**.
2. Isi kredensial Resend:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL)
   - Username: `resend`
   - Password: API key Resend kamu (disimpan di sini saja — jangan di frontend, jangan di chat).
3. **Sender email**: gunakan alamat dari domain yang sudah diverifikasi di Resend. Resend free tier hanya menjamin pengiriman ke email kamu sendiri (mis. `onboarding@resend.dev`) sampai domain diverifikasi.
4. Verifikasi domain di Resend (**Domains → Add Domain**), lalu tambahkan catatan DNS SPF/DKIM yang diminta Resend di DNS registrar domainmu. Kirim email produksi baru aman setelah domain berstatus `Verified`.
5. **Authentication → URL Configuration**: daftarkan Site URL dan Redirect URLs untuk lokal (mis. `http://localhost:3000`), preview, dan produksi (`https://dqau-donate.pages.dev`).
6. **Authentication → Emails**: sesuaikan template konfirmasi dan reset password (boleh memakai bahasa Indonesia), pastikan tautannya memakai `{{ .ConfirmationURL }}` / `{{ .ConfirmationURL }}?type=recovery` sesuai template bawaan Supabase.

## Batasan free tier

- Kuota email gratis Resend dapat berubah; jika kuota tercapai, pengiriman gagal dan aplikasi akan menampilkan error asli dari Supabase — tidak ada fallback berbayar otomatis.
- Rate limit pengiriman ulang dikendalikan Supabase Auth; aplikasi menambahkan cooldown 60 detik di sisi klien.

## Yang sengaja belum diaktifkan

- Verifikasi nomor telepon/SMS: **belum tersedia.** Resend adalah layanan email, bukan SMS. Bila nanti diperlukan, gunakan provider SMS yang didukung Supabase Auth dan biayanya perlu persetujuan pemilik.
