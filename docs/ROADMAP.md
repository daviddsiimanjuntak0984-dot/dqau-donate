# Rancangan teknis tahap lanjutan (BELUM dibangun)

Dokumen ini hanya rancangan. Tidak ada kode atau SQL di bawah ini yang sudah ditulis atau diuji.

## Aturan untuk semua tahap
1. **Uang dan status hanya diubah server** (Edge Function/webhook dengan service role). Browser tidak pernah menentukan "paid".
2. **Migrasi bertambah, tidak mengubah yang lama:** `002_chat.sql`, `003_alerts.sql`, `004_payments.sql`, `005_community.sql`. `001_init.sql` tidak diedit setelah dipakai.
3. **Urutan aman tiap tahap:** buat project Supabase staging > backup project produksi > jalankan migrasi di staging > uji dua akun > deploy preview Cloudflare Pages > baru produksi. Setiap migrasi disertai catatan cara membatalkan.
4. **Pola izin sama dengan fondasi:** RLS + grant per kolom + fungsi pembantu `security definer` dengan `search_path` kosong + pembatas laju per pengguna.
5. **Tombol baru disembunyikan** (flag di `app.js`) sampai tahapnya lolos uji.

## Tahap 2: Chat pribadi (`002_chat.sql`)
- `conversations(id, user_a, user_b, requester_id, status pending|active|declined, last_message_at)`; `check (user_a < user_b)` + unik per pasangan, jadi satu percakapan per dua orang.
- `messages(id, conversation_id, sender_id, kind text|image|audio, body, media_path, duration_s, created_at)`. Insert hanya jika pengirim peserta; status `pending` hanya boleh 1 pesan dari peminta.
- Status belum dibaca: `last_read_at` per peserta; jumlah belum dibaca dihitung dari `created_at`.
- `blocks(blocker_id, blocked_id)` dicek oleh policy insert pesan. `reports(reporter_id, target_type, target_id, reason)` hanya insert untuk klien; dibaca moderator lewat service role.
- Lampiran di bucket **privat** `chat-media` (`{conversation_id}/{uuid}.ext`); policy memeriksa keanggotaan; tampil lewat signed URL berumur pendek. Batas: gambar 5 MB, suara 60 detik/2 MB.
- Real-time: Supabase Realtime `postgres_changes` pada `messages` (RLS ikut berlaku).
- Risiko: format rekaman beda per browser (iOS memakai mp4/aac); MIME di server hanya header yang dikirim klien, bukan isi file.

## Tahap 3: Donasi interaktif + overlay (`003_alerts.sql`)
- Jenis dan minimum, dicek di **DB dan Edge Function**: teks Rp1.000; suara+teks Rp5.000 (maks 60 dtk, 3 MB); video+teks Rp10.000 (maks 30 dtk, 20 MB, mp4/webm). Batas atas mengikuti penyedia pembayaran.
- `donation_media(donation_id, kind, path, mime, size, duration_s, moderation approved|pending|rejected)` di bucket **privat** `donation-media`.
- `overlays(id, owner_id, token_hash, theme, position, width, duration_s 3-30, revoked_at)`. Token acak 32 byte ditampilkan **sekali**; yang disimpan hanya hash-nya. URL `overlay.html#t=<token>` (fragmen tidak ikut terkirim ke server). Bisa dicabut dan dibuat ulang.
- `alerts(id, donation_id unique, overlay_id, status queued|playing|played|skipped, is_test)`. `donation_id unique` mencegah alert ganda. Alert dibuat **hanya** oleh webhook setelah `paid`.
- Overlay tidak membaca tabel langsung. Edge Function `overlay-feed` memverifikasi token, mengembalikan alert berikutnya + signed URL media, lalu `overlay-ack` menandai `played` (idempoten).
- Klien overlay: antrean berurutan di memori, polling 3 detik dengan backoff saat terputus, ID yang sudah diputar disimpan agar tidak ulang, media gagal diputar > 5 detik jatuh ke teks saja. Teks selalu di-escape (tanpa HTML dari pengguna).
- Tombol **tes alert**: membuat baris `is_test` milik pemilik overlay, tanpa menyentuh `donations` dan tanpa uang.
- Moderasi: pilihan kreator "setujui dulu" atau otomatis, filter kata, tombol lewati/blokir donatur. Risiko: durasi/ukuran hanya dari metadata (bisa dipalsukan), dan tidak ada transcoding/pemindaian malware sampai ada layanan khusus.
- Kompatibilitas: butuh software yang punya **Browser Source** (mis. OBS Studio). Aplikasi live di HP umumnya tidak bisa memuat overlay web; dukungan tiap platform (Streamlabs, TikTok LIVE Studio, dll.) **harus diuji satu per satu** dan belum diverifikasi.

## Tahap 4: Pembayaran (`004_payments.sql` + Edge Function)
1. `create-donation`: validasi pengguna, penerima, jenis, dan nominal; buat baris `pending` dengan `idempotency_key` unik; minta transaksi ke penyedia; kembalikan `checkout_url`.
2. `payment-webhook`: verifikasi tanda tangan penyedia, **cocokkan nominal dengan baris kita**, dan cek ulang status ke API penyedia. Transisi hanya `pending > paid|failed|expired`; `paid` final. Webhook ganda tidak membuat alert ganda (`provider_ref` dan `alerts.donation_id` unik).
3. Riwayat: kreator melihat donasi yang diterima, pendukung melihat miliknya (policy select sudah ada).
4. Rahasia (kunci server penyedia, signature key) hanya di *Supabase secrets*. Mulai dari **sandbox**. Jangan aktifkan mode nyata sebelum webhook dan uji selesai.
5. Perlu dicek ke penyedia/ahli hukum: menampung uang untuk kreator dan mencairkannya bisa kena aturan izin pembayaran; refund dan sengketa belum dirancang.

## Tahap 5: Komunitas (`005_community.sql`)
- `follows(follower_id, followee_id)` PK gabungan, `check (follower_id <> followee_id)`.
- `notifications(id, user_id, type, actor_id, ref_id, read_at)` dibuat oleh trigger `security definer`, bukan klien; pemilik hanya boleh mengubah `read_at`.
- `profiles` mendapat `allow_chat_from everyone|followers|nobody`, dicek policy chat.
- Moderasi: tabel `moderators`/flag akun ditangguhkan, dikelola lewat service role; antrean `reports`.

## Status
| Fitur | Status |
|---|---|
| Login, profil, postingan, foto, like, komentar, album | Kode ditulis, **belum teruji** di Supabase |
| Chat, overlay, pembayaran, follow/notifikasi | Hanya rancangan |
| Butuh layanan eksternal | Penyedia pembayaran, penyedia SMS (OTP), konsol OAuth Google/Facebook, Supabase Realtime/Edge Functions |