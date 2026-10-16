// Dqau Donate: fitur komunitas. Memakai klien Supabase yang dibuat di index.html (window.sb).
const DONATION_ENDPOINT = ''; // Isi URL Edge Function pembayaran setelah dibuat (lihat README). Kosong = donasi dinonaktifkan.
const TYPES = ['image/jpeg', 'image/png', 'image/webp'], MAX_MB = 5;
const root = document.getElementById('app');
const $ = (s, r = root) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = d => new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
let sb, me = null, view = { name: 'feed' }, note = null;

const ready = new Promise(res => {
  if (window.sb) return res(window.sb);
  document.addEventListener('dqau:ready', () => res(window.sb), { once: true });
  setTimeout(() => res(window.sb || null), 5000);
});
const pub = p => (p ? sb.storage.from('media').getPublicUrl(p).data.publicUrl : '');
const say = (m, err) => { const t = $('#msg'); if (t) { t.textContent = m; t.style.color = err ? '#ffaaa9' : '#c7b3ff'; } };
const fail = e => say(e?.message || 'Terjadi kesalahan. Coba lagi.', true);
const go = (name, id) => { view = { name, id }; render(); root.scrollIntoView({ behavior: 'smooth' }); };
const loggedIn = () => { if (me) return true; say('Masuk dulu untuk memakai fitur ini (tombol Masuk / Daftar di atas).', true); return false; };
const name = a => esc(a?.display_name || a?.username || 'Pengguna');
// Hapus file Storage dan laporkan kegagalannya (file yatim: lihat README).
async function rmFiles(paths) {
  paths = paths.filter(Boolean); if (!paths.length) return;
  const { error } = await sb.storage.from('media').remove(paths);
  if (error) { note = { e: true, m: `Data dihapus, tetapi ${paths.length} file gagal dihapus dari penyimpanan (${error.message}). Lihat README: file yatim.` }; say(note.m, true); }
}
// Jika simpan metadata gagal setelah upload berhasil, file sementara wajib dibersihkan.
// Bila pembersihan juga gagal, laporkan kedua masalah agar file publik yang tertinggal tidak tersembunyi.
async function rollbackUpload(path, cause) {
  if (path) {
    try {
      const { error } = await sb.storage.from('media').remove([path]);
      if (error) throw error;
    } catch (cleanupError) {
      const original = cause?.message || 'Data gagal disimpan.';
      const cleanup = cleanupError?.message || 'kesalahan Storage tidak diketahui';
      throw new Error(`${original} Selain itu, file yang terunggah gagal dibersihkan dari penyimpanan: ${cleanup}. Jangan unggah ulang sebelum memeriksa Storage.`);
    }
  }
  throw cause instanceof Error ? cause : new Error('Data gagal disimpan.');
}

async function upload(file, kind) {
  if (!file || !file.size) return null;
  if (!TYPES.includes(file.type)) throw new Error('Gunakan gambar JPG, PNG, atau WebP.');
  if (file.size > MAX_MB * 1048576) throw new Error('Ukuran gambar maksimal ' + MAX_MB + ' MB.');
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
  const path = `${me.id}/${kind}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from('media').upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}
// Jalankan aksi sambil menonaktifkan tombol submit (mencegah klik ganda).
async function guarded(form, fn) {
  const b = form.querySelector('button[type=submit]'); if (b) b.disabled = true;
  try { await fn(); } catch (e) { fail(e); } finally { if (b) b.disabled = false; }
}

const POST_SEL = 'id,body,image_path,created_at,author_id,author:profiles!posts_author_id_fkey(username,display_name),likes(count),comments(count)';
async function showPosts(el, authorId) {
  let q = sb.from('posts').select(POST_SEL).order('created_at', { ascending: false }).limit(30);
  if (authorId) q = q.eq('author_id', authorId);
  const { data, error } = await q; if (error) throw error;
  if (!el.isConnected) return;
  let liked = new Set();
  if (me && data.length) {
    const r = await sb.from('likes').select('post_id').eq('user_id', me.id).in('post_id', data.map(p => p.id));
    liked = new Set((r.data || []).map(x => x.post_id));
  }
  if (!el.isConnected) return;
  el.innerHTML = data.length ? data.map(p => `<article class="card post" data-id="${p.id}">
    <button class="link" data-user="${p.author_id}">${name(p.author)}</button> <span class="tag">${when(p.created_at)}</span>
    <p style="white-space:pre-wrap;color:#fff">${esc(p.body)}</p>${p.image_path ? `<img loading="lazy" alt="Foto postingan" src="${esc(pub(p.image_path))}">` : ''}
    <div class="row"><button class="mini secondary ${liked.has(p.id) ? 'on' : ''}" data-like>♥ ${p.likes[0].count}</button>
    <button class="mini secondary" data-cm>💬 ${p.comments[0].count}</button>
    ${me?.id === p.author_id ? '<button class="mini secondary" data-del>Hapus</button>' : ''}</div><div class="cm"></div></article>`).join('') : '<p>Belum ada postingan.</p>';
  el.onclick = async e => {
    const card = e.target.closest('.post'), b = e.target.closest('button'); if (!b) return;
    try {
      if (b.dataset.user) return go('profile', b.dataset.user);
      if (!card) return;
      const id = card.dataset.id;
      if (b.hasAttribute('data-like')) {
        if (!loggedIn()) return;
        const on = b.classList.contains('on'), n = parseInt(b.textContent.replace(/\D/g, '')) || 0;
        b.disabled = true;
        const r = on ? await sb.from('likes').delete().eq('post_id', id).eq('user_id', me.id) : await sb.from('likes').insert({ post_id: id });
        b.disabled = false;
        if (r.error && r.error.code !== '23505') throw r.error;
        b.classList.toggle('on', !on); b.textContent = '♥ ' + Math.max(0, n + (on ? -1 : 1));
      } else if (b.hasAttribute('data-cm')) await showComments(card.querySelector('.cm'), id);
      else if (b.hasAttribute('data-del') && confirm('Hapus postingan ini?')) {
        const path = data.find(p => p.id === id)?.image_path;
        const { error } = await sb.from('posts').delete().eq('id', id); if (error) throw error;
        await rmFiles([path]);
        card.remove();
      }
    } catch (err) { b.disabled = false; fail(err); }
  };
}

async function showComments(el, postId) {
  if (el.innerHTML) { el.innerHTML = ''; return; }
  const { data, error } = await sb.from('comments').select('id,body,created_at,author_id,author:profiles!comments_author_id_fkey(username,display_name)').eq('post_id', postId).order('created_at').limit(100);
  if (error) throw error;
  if (!el.isConnected) return;
  el.innerHTML = data.map(c => `<p data-c="${c.id}"><b>${name(c.author)}</b>: <span style="color:#fff">${esc(c.body)}</span>${me?.id === c.author_id ? ' <button class="link" data-dc>hapus</button>' : ''}</p>`).join('') +
    `<form class="f"><input name="body" maxlength="500" required placeholder="Tulis komentar..."><button class="mini" type="submit">Kirim</button></form>`;
  el.onclick = async e => {
    if (!e.target.matches('[data-dc]')) return;
    const p = e.target.closest('p'); const { error } = await sb.from('comments').delete().eq('id', p.dataset.c);
    error ? fail(error) : p.remove();
  };
  el.querySelector('form').onsubmit = async e => {
    e.preventDefault(); if (!loggedIn()) return;
    const f = e.target, body = f.body.value.trim(); if (!body) return;
    await guarded(f, async () => {
      const { error } = await sb.from('comments').insert({ post_id: postId, body }); if (error) throw error;
      el.innerHTML = ''; await showComments(el, postId);
    });
  };
}

const views = {
  async feed(v) {
    v.innerHTML = `<form class="f card" id="pf"><textarea name="body" rows="3" maxlength="1000" required placeholder="Apa yang ingin kamu bagikan?"></textarea>
      <input type="file" name="img" accept="image/jpeg,image/png,image/webp"><button type="submit">Posting</button></form><div class="stack" id="list">Memuat...</div>`;
    $('#pf').onsubmit = async e => {
      e.preventDefault(); if (!loggedIn()) return;
      const f = e.target, body = f.body.value.trim(); if (!body) return say('Isi postingan tidak boleh kosong.', true);
      await guarded(f, async () => {
        say('Mengirim...');
        const image_path = await upload(f.img.files[0], 'posts');
        const { error } = await sb.from('posts').insert({ body, image_path });
        if (error) await rollbackUpload(image_path, error);
        note = { m: 'Terkirim.' }; await render();
      });
    };
    await showPosts($('#list'));
  },
  async profile(v) {
    const id = view.id || me?.id; if (!id) { v.innerHTML = '<p>Masuk untuk melihat profilmu.</p>'; return; }
    const { data: p, error } = await sb.from('profiles').select('*').eq('id', id).single(); if (error) throw error;
    // Abaikan hasil lama jika pengguna sudah berpindah tampilan saat permintaan berjalan.
    if (!v.isConnected || $('#view') !== v) return;
    const own = me?.id === id;
    v.innerHTML = `<div class="card"><h3>${name(p)}</h3><span class="tag">@${esc(p.username)}</span><p>${esc(p.bio) || 'Belum ada bio.'}</p></div>`;
    if (own) {
      v.insertAdjacentHTML('beforeend', `<form class="f card" id="ef"><h3>Ubah profil</h3><input name="dn" maxlength="40" placeholder="Nama tampilan" value="${esc(p.display_name)}">
        <input name="un" required pattern="[a-z0-9_]{3,20}" placeholder="username (huruf kecil, angka, _)" value="${esc(p.username)}"><textarea name="bio" rows="3" maxlength="300" placeholder="Bio">${esc(p.bio)}</textarea><button type="submit">Simpan</button></form>`);
      $('#ef').onsubmit = async e => {
        e.preventDefault(); const f = e.target;
        await guarded(f, async () => {
          const { error } = await sb.from('profiles').update({ display_name: f.dn.value.trim(), username: f.un.value.trim(), bio: f.bio.value.trim() }).eq('id', me.id);
          if (error) throw new Error(error.code === '23505' ? 'Username sudah dipakai.' : error.message);
          note = { m: 'Profil disimpan.' }; await render();
        });
      };
    } else {
      v.insertAdjacentHTML('beforeend', `<form class="f card" id="df"><h3>Dukung ${name(p)}</h3><input name="amt" type="number" min="1000" max="10000000" step="500" required placeholder="Nominal (Rp, minimal 1.000)">
        <input name="who" maxlength="40" placeholder="Nama (opsional)"><input name="msg" maxlength="200" placeholder="Pesan (opsional)"><button type="submit">Lanjut ke pembayaran</button>
        <p class="muted-note">${DONATION_ENDPOINT ? 'Kamu akan diarahkan ke halaman pembayaran penyedia.' : 'Pembayaran belum diaktifkan. Tidak ada uang yang diproses.'}</p></form>`);
      $('#df').onsubmit = async e => {
        e.preventDefault(); const f = e.target, amt = Number(f.amt.value);
        if (!Number.isInteger(amt) || amt < 1000 || amt > 10000000) return say('Nominal harus 1.000 sampai 10.000.000.', true);
        if (!DONATION_ENDPOINT) return say('Pembayaran belum diaktifkan. Tidak ada uang yang diproses.', true);
        await guarded(f, async () => {
          const { data: { session } } = await sb.auth.getSession();
          const r = await fetch(DONATION_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: 'Bearer ' + session.access_token } : {}) },
            body: JSON.stringify({ recipient_id: id, amount_idr: amt, donor_name: f.who.value.trim(), message: f.msg.value.trim() }) });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || !String(j.checkout_url || '').startsWith('https://')) throw new Error(j.error || 'Gagal membuat donasi.');
          location.href = j.checkout_url;
        });
      };
    }
    v.insertAdjacentHTML('beforeend', '<h3>Postingan</h3><div class="stack" id="list"></div>');
    await showPosts($('#list', v), id);
  },
  async albums(v) {
    if (view.id) return views.album(v);
    v.innerHTML = `<form class="f card" id="af"><input name="t" maxlength="60" required placeholder="Judul album baru"><button type="submit">Buat album</button></form><div class="cards" id="list">Memuat...</div>`;
    $('#af').onsubmit = async e => {
      e.preventDefault(); if (!loggedIn()) return; const f = e.target;
      await guarded(f, async () => { const { error } = await sb.from('albums').insert({ title: f.t.value.trim() }); if (error) throw error; await render(); });
    };
    const { data, error } = await sb.from('albums').select('id,title,owner:profiles!albums_owner_id_fkey(username,display_name),photos(count)').order('created_at', { ascending: false }).limit(30); if (error) throw error;
    if (!v.isConnected || $('#view') !== v) return;
    const l = $('#list', v); l.innerHTML = data.length ? data.map(a => `<article class="card"><h3>${esc(a.title)}</h3><span class="tag">${name(a.owner)} · ${a.photos[0].count} foto</span><div class="row"><button class="mini" data-a="${a.id}">Buka</button></div></article>`).join('') : '<p>Belum ada album.</p>';
    l.onclick = e => { const b = e.target.closest('[data-a]'); if (b) go('albums', b.dataset.a); };
  },
  async album(v) {
    const requestedAlbumId = view.id;
    const { data: a, error } = await sb.from('albums').select('id,title,owner_id,owner:profiles!albums_owner_id_fkey(username,display_name)').eq('id', requestedAlbumId).single(); if (error) throw error;
    if (!v.isConnected || $('#view') !== v || view.id !== requestedAlbumId) return;
    const own = me?.id === a.owner_id;
    v.innerHTML = `<button class="mini secondary" id="back">← Semua album</button><h3>${esc(a.title)}</h3><span class="tag">${name(a.owner)}</span>` +
      (own ? `<form class="f card" id="uf"><input type="file" name="img" accept="image/jpeg,image/png,image/webp" required><input name="cap" maxlength="200" placeholder="Keterangan (opsional)"><button type="submit">Unggah foto</button></form><button class="mini secondary" id="dalb">Hapus album</button>` : '') + '<div class="grid" id="g"></div>';
    $('#back').onclick = () => go('albums');
    const { data: ph, error: e2 } = await sb.from('photos').select('id,path,caption').eq('album_id', a.id).order('created_at', { ascending: false }).limit(100); if (e2) throw e2;
    if (!v.isConnected || $('#view') !== v || view.id !== requestedAlbumId) return;
    $('#g', v).innerHTML = ph.map(p => `<figure style="margin:0" data-p="${p.id}"><img loading="lazy" alt="${esc(p.caption) || 'Foto album'}" src="${esc(pub(p.path))}"><figcaption class="tag">${esc(p.caption)}${own ? ' <button class="link" data-dp>hapus</button>' : ''}</figcaption></figure>`).join('') || '<p>Album masih kosong.</p>';
    if (!own) return;
    $('#uf').onsubmit = async e => {
      e.preventDefault(); const f = e.target;
      await guarded(f, async () => {
        say('Mengunggah...'); const path = await upload(f.img.files[0], 'photos');
        const { error } = await sb.from('photos').insert({ album_id: a.id, path, caption: f.cap.value.trim() });
        if (error) await rollbackUpload(path, error);
        note = { m: 'Foto ditambahkan.' }; await render();
      });
    };
    $('#g').onclick = async e => {
      if (!e.target.matches('[data-dp]') || !confirm('Hapus foto ini?')) return;
      const fig = e.target.closest('figure'), item = ph.find(p => p.id === fig.dataset.p);
      const { error } = await sb.from('photos').delete().eq('id', item.id); if (error) return fail(error);
      await rmFiles([item.path]); fig.remove();
    };
    $('#dalb').onclick = async () => {
      if (!confirm('Hapus album dan semua fotonya?')) return;
      const all = await sb.from('photos').select('path').eq('album_id', a.id); if (all.error) return fail(all.error);
      const { error } = await sb.from('albums').delete().eq('id', a.id); if (error) return fail(error);
      await rmFiles(all.data.map(p => p.path)); go('albums');
    };
  }
};

async function render() {
  root.innerHTML = `<h2 class="section-title">Komunitas</h2><nav class="tabs"><button data-go="feed">Beranda</button><button data-go="albums">Album</button><button data-go="profile">Profil saya</button></nav><p id="msg" class="message" role="status"></p><div id="view">Memuat...</div>`;
  root.querySelectorAll('[data-go]').forEach(b => (b.onclick = () => go(b.dataset.go)));
  if (note) { say(note.m, note.e); note = null; }
  // Ikat hasil async/error ke tampilan yang memulai render, bukan tab yang datang sesudahnya.
  const target = $('#view');
  const targetView = view;
  try {
    await views[targetView.name](target);
  } catch (e) {
    if (target.isConnected && $('#view') === target) {
      target.innerHTML = '';
      fail(e);
    }
  }
}

async function loadCreators() {
  const box = document.getElementById('cards'); if (!box) return;
  const { data, error } = await sb.from('profiles').select('id,username,display_name,bio').order('created_at', { ascending: false }).limit(12);
  if (error) { box.innerHTML = '<p class="notice">Gagal memuat kreator: ' + esc(error.message) + '</p>'; return; }
  box.innerHTML = data.length ? data.map(p => `<article class="card" data-search="${esc((p.display_name + ' ' + p.username).toLowerCase())}"><div class="avatar">👤</div><h3>${name(p)}</h3><span class="tag">@${esc(p.username)}</span><p>${esc(p.bio) || 'Belum ada bio.'}</p><button type="button" class="profileButton" data-id="${p.id}">Lihat profil &amp; dukung</button></article>`).join('') : '<p>Belum ada kreator terdaftar.</p>';
  box.onclick = e => { const b = e.target.closest('[data-id]'); if (b) go('profile', b.dataset.id); };
}

(async () => {
  sb = await ready;
  if (!sb) { root.innerHTML = '<p class="notice">Fitur komunitas butuh koneksi Supabase. Periksa key di index.html dan koneksi internet.</p>'; document.getElementById('cards').innerHTML = '<p>Kreator belum dapat dimuat.</p>'; return; }
  me = (await sb.auth.getSession()).data.session?.user ?? null;
  sb.auth.onAuthStateChange((_e, s) => { const u = s?.user ?? null; if (u?.id !== me?.id) { me = u; render(); loadCreators(); } });
  render(); loadCreators();
})();