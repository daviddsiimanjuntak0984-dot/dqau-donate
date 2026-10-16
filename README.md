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
1. Pastikan Cloudflare Pages membuat Preview Deployment untuk branch `staging/finish-foundation-2026-10-16`. Jangan merge ke `main` sebelum pengujian.
2. Supabase Auth > URL Configuration: tambahkan URL preview Cloudflare yang sebenarnya setelah tersedia. Jangan tebak URL.
3. Uji pendaftaran/login, logout, profil, buat/hapus postingan, foto, like (termasuk unlike), komentar, album, upload dan hapus foto, serta uji izin menggunakan dua akun.
4. Pastikan anonymous user bisa membaca konten yang ditujukan publik tetapi tidak bisa menulis. Pastikan user B tidak bisa menghapus atau mengubah data milik user A.
5. Jangan memasukkan service-role key, OAuth client secret, atau payment secret ke frontend/repository.

## Catatan keamanan
- RLS aktif pada `profiles`, `posts`, `likes`, `comments`, `albums`, `photos`, dan `donations`.
- Bucket `media` bersifat publik: gambar yang URL-nya diketahui dapat diakses tanpa login. Jangan unggah materi privat/sensitif.
- Batas gambar adalah 5 MB dan tipe JPG/PNG/WebP; validasi MIME dari klien bukan pemindaian isi file.
- Data donasi hanya boleh ditulis backend setelah payment provider diverifikasi. Browser tidak boleh menandai transaksi sebagai lunas.
