# Dqua Donate — branch pengujian

Platform komunitas kreator dengan login, profil, postingan, foto, like, komentar, dan album.

## Konfigurasi branch ini
- Supabase staging project: `wztmgafrtxecvxzibzaq`
- Website ini diarahkan ke staging, bukan database produksi.
- Frontend: `index.html` + `app.js`; tidak memerlukan build step.
- Database schema: `supabase/migrations/001_init.sql` (sudah dipasang di staging pada 16 Oktober 2026; jangan dijalankan ulang).
- Cloudflare Pages production branch `main` tidak diubah oleh commit ini.

## Status fitur
- Fondasi database/RLS: dipasang; pemeriksaan tabel dan RLS lulus.
- Login email/password: kode tersedia, perlu uji browser; konfirmasi email dan URL redirect perlu diperiksa di Supabase Auth.
- Login Google/Facebook: perlu provider credential dan redirect yang benar di dashboard Supabase. Tidak dianggap aktif sampai diuji.
- OTP nomor HP: perlu penyedia SMS yang sudah dikonfigurasi; bisa menimbulkan biaya.
- Profil, postingan, upload foto, like, komentar, album: kode tersedia, perlu uji end-to-end dua akun.
- Donasi: **dinonaktifkan** karena endpoint dan webhook pembayaran belum dibangun/diverifikasi. Jangan menerima uang melalui situs ini.
- Chat, notifikasi/follow, alert donasi, dan OBS overlay: belum diimplementasikan; lihat `docs/ROADMAP.md`.

## Penyebaran dan pengujian
1. Preview Deployment branch tersedia: https://staging-finish-foundation-20.dqau-donate.pages.dev (deployment commit saat review: https://f8b09af3.dqau-donate.pages.dev). Jangan merge ke `main` sebelum pengujian.
2. **Wajib diperbaiki pada dashboard Supabase staging** ([URL Configuration](https://supabase.com/dashboard/project/wztmgafrtxecvxzibzaq/auth/url-configuration)):
   - Site URL = `https://staging-finish-foundation-20.dqau-donate.pages.dev`
   - Tambahkan ke Redirect URLs:
     - `https://staging-finish-foundation-20.dqau-donate.pages.dev`
     - `https://staging-finish-foundation-20.dqau-donate.pages.dev/**`
     - `https://*.dqau-donate.pages.dev/**` (untuk preview commit Cloudflare)
   - Di **Authentication > Email Templates > Confirm signup**, pastikan tombol menggunakan `{{ .ConfirmationURL }}`. Bila template membangun URL sendiri menggunakan `{{ .SiteURL }}`, ganti target redirect-nya dengan `{{ .RedirectTo }}`.
   - Project produksi terpisah: ([URL Configuration production](https://supabase.com/dashboard/project/aaqfamoedywfjidwupou/auth/url-configuration)) Site URL tetap `https://dqau-donate.pages.dev`; jangan ubah production menjadi staging.
3. Uji pendaftaran/login, logout, profil, buat/hapus postingan, foto, like (termasuk unlike), komentar, album, upload dan hapus foto, serta uji izin menggunakan dua akun.
4. Pastikan anonymous user bisa membaca konten yang ditujukan publik tetapi tidak bisa menulis. Pastikan user B tidak bisa menghapus atau mengubah data milik user A.
5. Jangan memasukkan service-role key, OAuth client secret, atau payment secret ke frontend/repository.

### Memulihkan konfirmasi akun
- Jika tautan konfirmasi yang lama mengarah ke localhost, jangan gunakan tautan tersebut lagi karena targetnya sudah tertanam pada email lama.
- Setelah Redirect URLs/template staging diperbaiki, buka branch preview, klik **Masuk / Daftar > Buat akun**, masukkan email yang sama, lalu klik **Kirim ulang email konfirmasi**. Gunakan email terbaru.
- Kode frontend meminta `emailRedirectTo: window.location.origin` saat sign-up dan resend. Fungsi resend telah ditambahkan ke modal; pengaturan allowlist dan template di atas tetap diperlukan.

### Penghapusan akun admin dan media
- Jangan hapus akun yang memiliki media publik langsung dari Supabase Auth Dashboard: penghapusan Auth biasa tidak menghapus objek di Storage.
- Sumber fungsi aman ada di **supabase/functions/admin-delete-user/index.ts**. Fungsi menghapus semua objek pada folder **media/<user_id>/** terlebih dahulu, lalu menghapus akun Auth sehingga relasi database mengikuti aturan cascade.
- Fungsi hanya menerima POST dengan sesi valid dan memeriksa **app_metadata.role = admin** (metadata yang hanya boleh ditetapkan server/admin). Fungsi menolak penghapusan akun admin yang sedang dipakai. Jangan pernah menggunakan **user_metadata** untuk izin admin.
- Fungsi sudah dideploy ke project staging dengan JWT verification aktif. Sebelum dipakai untuk penghapusan akun, tetapkan role admin melalui proses server tepercaya, lalu uji menggunakan akun uji yang berisi media. Jika pembersihan Storage gagal, fungsi tidak akan menghapus akun.

## Catatan keamanan
- RLS aktif pada `profiles`, `posts`, `likes`, `comments`, `albums`, `photos`, dan `donations`.
- Bucket `media` bersifat publik: gambar yang URL-nya diketahui dapat diakses tanpa login. Jangan unggah materi privat/sensitif.
- Batas gambar adalah 5 MB dan tipe JPG/PNG/WebP; validasi MIME dari klien bukan pemindaian isi file.
- Data donasi hanya boleh ditulis backend setelah payment provider diverifikasi. Browser tidak boleh menandai transaksi sebagai lunas.
