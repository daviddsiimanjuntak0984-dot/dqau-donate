# Sinkronisasi commit lokal ke GitHub

Commit `084c54b` di branch `feature/social-feed-launch` (lokal: /tmp/cc-agent/72134182/project/work) belum bisa di-push karena lingkungan sandbox tidak punya kredensial GitHub.

Isi commit:
- `src/PublicFeed.tsx` (baru) — feed komunitas publik: pagination, like/unlike optimistis dengan rollback, komentar + composer, Web Share/clipboard, lightbox gambar, skeleton/empty/error state, dukung prefers-reduced-motion.
- `src/App.tsx` — PublicFeed dipasang di bagian "Temukan kreator" pada beranda.
- `src/index.css` — gaya `.public-feed`, `.feed-card`, dll + `.sr-only`.
- `.gitignore` — tambahan `dist/`.

Langkah push oleh pemilik (dari komputer dengan akses GitHub):

```
git fetch origin
git checkout -b feature/social-feed-launch origin/main
# salin 3 file di atas dari proyek Bolt (src/PublicFeed.tsx, src/App.tsx, src/index.css, .gitignore)
git add src/PublicFeed.tsx src/App.tsx src/index.css .gitignore
git commit -m "Add public community feed on the homepage"
git push -u origin feature/social-feed-launch
```

Lalu buka PR `feature/social-feed-launch` → `main`. Setelah CI hijau dan disetujui, merge untuk dilayani di https://dqau-donate.my.id/ (Cloudflare Pages).
