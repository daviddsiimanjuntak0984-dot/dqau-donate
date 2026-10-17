import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

interface CreatorProfile { id: string; username: string; display_name: string; bio: string; avatar_url: string | null; created_at: string; }


interface PlatformCard {
  id: string;
  avatar: string;
  name: string;
  tag: string;
  desc: string;
  link: string;
  linkLabel: string;
}

const PLATFORMS: PlatformCard[] = [
  {
    id: 'discord',
    avatar: '💬',
    name: 'Discord',
    tag: 'Server komunitas',
    desc: 'Tempat ngobrol, membuat kanal penggemar, dan mengumumkan jadwal streaming.',
    link: 'https://discord.com/',
    linkLabel: 'Buka Discord ↗',
  },
  {
    id: 'youtube',
    avatar: '▶️',
    name: 'YouTube',
    tag: 'Video & live',
    desc: 'Bagikan video, siaran langsung, dan kanal kreator.',
    link: 'https://www.youtube.com/',
    linkLabel: 'Buka YouTube ↗',
  },
  {
    id: 'twitch',
    avatar: '🎮',
    name: 'Twitch',
    tag: 'Live streaming',
    desc: 'Bangun komunitas penonton saat streaming berlangsung.',
    link: 'https://www.twitch.tv/',
    linkLabel: 'Buka Twitch ↗',
  },
  {
    id: 'tiktok',
    avatar: '🎵',
    name: 'TikTok',
    tag: 'Video pendek & LIVE',
    desc: 'Jangkau penggemar melalui video pendek dan siaran LIVE.',
    link: 'https://www.tiktok.com/',
    linkLabel: 'Buka TikTok ↗',
  },
  {
    id: 'instagram',
    avatar: '📸',
    name: 'Instagram',
    tag: 'Update kreator',
    desc: 'Bagikan kabar, foto, dan cuplikan kegiatan komunitas.',
    link: 'https://www.instagram.com/',
    linkLabel: 'Buka Instagram ↗',
  },
  {
    id: 'facebook',
    avatar: '👥',
    name: 'Facebook',
    tag: 'Grup & halaman',
    desc: 'Hubungkan penggemar lewat halaman atau grup kreator.',
    link: 'https://www.facebook.com/',
    linkLabel: 'Buka Facebook ↗',
  },
  {
    id: 'telegram',
    avatar: '✈️',
    name: 'Telegram',
    tag: 'Grup & pengumuman',
    desc: 'Buat grup atau kanal untuk mengirim pengumuman ke penggemar.',
    link: 'https://telegram.org/',
    linkLabel: 'Buka Telegram ↗',
  },
  {
    id: 'whatsapp',
    avatar: '📱',
    name: 'WhatsApp',
    tag: 'Komunitas & channel',
    desc: 'Bagikan pembaruan melalui komunitas atau channel WhatsApp.',
    link: 'https://www.whatsapp.com/',
    linkLabel: 'Buka WhatsApp ↗',
  },
];

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState<{ text: string; isError: boolean }>({ text: '', isError: false });
  const [loading, setLoading] = useState(false);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<CreatorProfile[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileName, setProfileName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<CreatorProfile | null>(null);

  useEffect(() => {
    const loadProfiles = async () => {
      setProfileLoading(true);
      const { data, error } = await supabase.from('profiles').select('id, username, display_name, bio, avatar_url, created_at').order('created_at', { ascending: false });
      if (!error && data) {
        const loadedProfiles = data as CreatorProfile[];
        setProfiles(loadedProfiles);
        const creatorUsername = new URLSearchParams(window.location.search).get('creator');
        if (creatorUsername) setSelectedProfile(loadedProfiles.find((profile) => profile.username === creatorUsername) || null);
      }
      setProfileLoading(false);
    };
    void loadProfiles();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) { setProfileName(''); setUsername(''); setBio(''); setAvatarUrl(''); setAvatarPreview(null); return; }
    const loadMyProfile = async () => {
      const { data } = await supabase.from('profiles').select('username, display_name, bio, avatar_url').eq('id', user.id).maybeSingle();
      if (data) { setProfileName(data.display_name || ''); setUsername(data.username || ''); setBio(data.bio || ''); setAvatarUrl(data.avatar_url || ''); setAvatarPreview(data.avatar_url || null); }
    };
    void loadMyProfile();
  }, [user]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setSearch(searchInput), 250);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    const value = username.trim().toLowerCase();
    if (!user || !/^[a-z0-9_]{3,24}$/.test(value)) {
      setUsernameStatus('idle');
      return;
    }
    let active = true;
    setUsernameStatus('checking');
    const timeoutId = window.setTimeout(async () => {
      const { data, error } = await supabase.from('profiles').select('id').eq('username', value).neq('id', user.id).maybeSingle();
      if (!active) return;
      if (error) setUsernameStatus('error');
      else setUsernameStatus(data ? 'taken' : 'available');
    }, 350);
    return () => { active = false; window.clearTimeout(timeoutId); };
  }, [username, user]);

  useEffect(() => {
    const syncCreatorFromUrl = () => {
      const creatorUsername = new URLSearchParams(window.location.search).get('creator');
      if (!creatorUsername) { setSelectedProfile(null); return; }
      const match = profiles.find((profile) => profile.username === creatorUsername);
      setSelectedProfile(match || null);
    };
    window.addEventListener('popstate', syncCreatorFromUrl);
    return () => window.removeEventListener('popstate', syncCreatorFromUrl);
  }, [profiles]);

  useEffect(() => {
    const selector = modalOpen ? '#authModal .dialog' : selectedProfile ? '#creatorDialog .alert-dialog' : alertInfo ? '#alertDialog .alert-dialog' : null;
    if (!selector) return;
    const activeDialog = document.querySelector<HTMLElement>(selector);
    if (!activeDialog) return;
    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    activeDialog.tabIndex = -1;
    activeDialog.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (modalOpen) { setModalOpen(false); setAuthMessage({ text: '', isError: false }); }
        else if (selectedProfile) { const url = new URL(window.location.href); url.searchParams.delete('creator'); window.history.replaceState({}, '', url); setSelectedProfile(null); }
        else if (alertInfo) setAlertInfo(null);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(activeDialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) { event.preventDefault(); activeDialog.focus(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === activeDialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previousActive?.focus(); };
  }, [modalOpen, selectedProfile, alertInfo]);

  const handleAccountClick = async () => {
    if (user) {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      setLoading(false);
      if (error) {
        setAlertInfo('Gagal keluar: ' + error.message);
      }
    } else {
      setAuthMode('login');
      setAuthMessage({ text: '', isError: false });
      setShowPhoneAuth(false);
      setModalOpen(true);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthMessage({
      text: authMode === 'signup' ? 'Membuat akun...' : 'Memeriksa akun...',
      isError: false,
    });

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setAuthMessage({
            text: 'Akun dibuat. Periksa email untuk konfirmasi sebelum masuk.',
            isError: false,
          });
        } else {
          setAuthMessage({
            text: 'Akun berhasil dibuat dan kamu sudah masuk.',
            isError: false,
          });
          setTimeout(() => {
            setModalOpen(false);
          }, 900);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setAuthMessage({
          text: 'Berhasil masuk.',
          isError: false,
        });
        setTimeout(() => {
          setModalOpen(false);
        }, 900);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.';
      setAuthMessage({ text: errorMessage, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'facebook' | 'tiktok') => {
    setLoading(true);
    setAuthMessage({ text: 'Menghubungkan ke ' + provider + '...', isError: false });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as 'google' | 'facebook',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'periksa konfigurasi Supabase.';
      setAuthMessage({
        text: 'Gagal memulai login ' + provider + ': ' + msg,
        isError: true,
      });
      setLoading(false);
    }
  };

  const handleSendPhoneCode = async () => {
    const trimmed = phoneNumber.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(trimmed)) {
      setAuthMessage({
        text: 'Gunakan format internasional, misalnya +62812xxxxxxxx.',
        isError: true,
      });
      return;
    }
    setPhoneLoading(true);
    setAuthMessage({ text: 'Mengirim kode SMS...', isError: false });
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: trimmed });
      if (error) throw error;
      setAuthMessage({
        text: 'Jika SMS provider sudah aktif, kode verifikasi akan dikirim ke nomor tersebut.',
        isError: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Periksa konfigurasi SMS Supabase.';
      setAuthMessage({ text: msg, isError: true });
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    const phone = phoneNumber.trim();
    const token = phoneCode.trim();
    if (!phone || !token) {
      setAuthMessage({ text: 'Masukkan nomor HP dan kode SMS terlebih dahulu.', isError: true });
      return;
    }
    setPhoneLoading(true);
    setAuthMessage({ text: 'Memverifikasi kode...', isError: false });
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
      if (error) throw error;
      setAuthMessage({ text: 'Nomor berhasil diverifikasi dan kamu sudah masuk.', isError: false });
      setTimeout(() => {
        setModalOpen(false);
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kode tidak valid atau sudah kedaluwarsa.';
      setAuthMessage({ text: msg, isError: true });
    } finally {
      setPhoneLoading(false);
    }
  };

  const filteredProfiles = profiles.filter((profile) => {
    const q = search.toLowerCase().trim();
    return !q || [profile.username, profile.display_name, profile.bio].some(v => (v || '').toLowerCase().includes(q));
  });

  const uploadAvatar = async (file: File) => {
    if (!user) { setProfileMessage('Silakan masuk terlebih dahulu untuk mengunggah avatar.'); return null; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setProfileMessage('Gunakan gambar JPG, PNG, atau WebP.'); return null; }
    if (file.size > 2 * 1024 * 1024) { setProfileMessage('Ukuran maksimal avatar 2MB.'); return null; }
    setAvatarUploading(true);
    setProfileMessage('Mengunggah avatar...');
    try {
      const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
      const filePath = `${user.id}/${Date.now()}.${extension}`;
      const bucket = 'avatars';
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl || '';
      setAvatarUrl(publicUrl);
      setAvatarPreview(publicUrl);
      setProfileMessage('Avatar berhasil diunggah. Ingat untuk menyimpan profil.');
      return publicUrl;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah avatar.';
      setProfileMessage(msg);
      return null;
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) {
      // quick client preview
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(String(reader.result));
      reader.readAsDataURL(f);
      void uploadAvatar(f);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) { setProfileMessage('Username harus 3–24 karakter: huruf kecil, angka, atau garis bawah.'); return; }
    setSavingProfile(true); setProfileMessage('');
    if (usernameStatus === 'taken') {
      setProfileMessage('Username sudah dipakai. Pilih username lain.');
      setSavingProfile(false);
      return;
    }
    const { data: savedProfile, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: cleanUsername, display_name: profileName.trim(), bio: bio.trim(), avatar_url: avatarUrl.trim() || null })
      .select('id, username, display_name, bio, avatar_url, created_at')
      .single();
    if (error) setProfileMessage(error.code === '23505' ? 'Username sudah dipakai. Pilih username lain.' : 'Gagal menyimpan: ' + error.message);
    else {
      if (savedProfile) setProfiles((current) => [savedProfile as CreatorProfile, ...current.filter((profile) => profile.id !== user.id)]);
      setProfileMessage('Profil berhasil disimpan.');
      const { data } = await supabase.from('profiles').select('id, username, display_name, bio, avatar_url, created_at').order('created_at', { ascending: false });
      if (data) setProfiles(data as CreatorProfile[]);
    }
    setSavingProfile(false);
  };

  const openCreatorProfile = (profile: CreatorProfile) => {
    const url = new URL(window.location.href);
    url.searchParams.set('creator', profile.username);
    window.history.pushState({}, '', url);
    setSelectedProfile(profile);
  };

  const closeCreatorProfile = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('creator');
    window.history.replaceState({}, '', url);
    setSelectedProfile(null);
  };

  const scrollToCreators = () => {
    const elem = document.getElementById('kreator');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header>
        <div className="logo">✦ Dqau Donate</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span className="account" id="accountStatus">
            {user ? user.email || 'Sudah masuk' : 'Belum masuk'}
          </span>
          <button
            id="accountButton"
            type="button"
            disabled={loading}
            onClick={handleAccountClick}
          >
            {user ? 'Keluar' : 'Masuk / Daftar'}
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <small>✦ RUANG UNTUK PARA KREATOR</small>
          <h1>Apresiasi karya.<br />Dukung kreator.</h1>
          <p>Temukan kreator favoritmu dan tunjukkan dukungan untuk karya mereka.</p>
          <button type="button" onClick={scrollToCreators}>
            Jelajahi kreator ↓
          </button>
        </section>

        <h2 className="section-title" id="kreator">Temukan kreator</h2>
        <p>Dukungan kecil bisa berarti besar.</p>
        <input
          className="search"
          id="search"
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Cari nama atau kategori kreator..."
        />

        {user && <section className="profile-editor">
          <h3>Profil kreator kamu</h3><p>Profil ini disimpan ke database dan ditampilkan kepada pengunjung.</p>
          <form onSubmit={saveProfile}>
            <label htmlFor="creatorDisplayName">Nama tampilan</label><input id="creatorDisplayName" value={profileName} onChange={e => setProfileName(e.target.value)} maxLength={60} placeholder="Nama yang akan ditampilkan" />
            <label htmlFor="creatorUsername">Username unik</label><input id="creatorUsername" value={username} onChange={e => setUsername(e.target.value)} required minLength={3} maxLength={24} pattern="[a-zA-Z0-9_]{3,24}" aria-describedby="usernameStatus" placeholder="username_kamu" />
            <small id="usernameStatus" className={`username-status ${usernameStatus}`} aria-live="polite">{usernameStatus === 'checking' ? 'Memeriksa username…' : usernameStatus === 'available' ? 'Username tersedia.' : usernameStatus === 'taken' ? 'Username sudah dipakai.' : usernameStatus === 'error' ? 'Tidak bisa memeriksa username; validasi akan dilakukan saat menyimpan.' : '3–24 karakter: huruf, angka, atau garis bawah.'}</small>
            <label htmlFor="creatorBio">Bio</label><textarea id="creatorBio" value={bio} onChange={e => setBio(e.target.value)} maxLength={500} rows={3} placeholder="Ceritakan tentang karya kamu" />

            <label htmlFor="creatorAvatar">Foto profil (unggah)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 8 }}>
              {avatarPreview ? <img className="creator-avatar-image" src={avatarPreview} alt="preview" /> : <div className="avatar">👤</div>}
              <div style={{ flex: 1 }}>
                <input id="creatorAvatar" type="file" accept="image/*" onChange={handleAvatarFileChange} />
                <div style={{ marginTop: 6 }}>
                  <small style={{ color: '#aaa3bd' }}>{avatarUploading ? 'Mengunggah avatar…' : 'Pilih gambar JPG/PNG maksimal 2MB'}</small>
                </div>
              </div>
            </div>

            <button type="submit" disabled={savingProfile}>{savingProfile ? 'Menyimpan…' : 'Simpan profil'}</button>
            {profileMessage && <p className="message" role="status">{profileMessage}</p>}
          </form>
        </section>}
        <section className="cards" id="cards">
          {profileLoading ? Array.from({ length: 6 }, (_, index) => <article key={`skeleton-${index}`} className="card skeleton-card" aria-hidden="true"><div className="skeleton skeleton-avatar" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /><div className="skeleton skeleton-block" /></article>) : filteredProfiles.map(profile => (
            <article key={profile.id} className="card creator-profile-card">
              {profile.avatar_url ? <img className="creator-avatar-image" src={profile.avatar_url} alt={profile.display_name || profile.username} /> : <div className="avatar">{(profile.display_name || profile.username || 'K').charAt(0).toUpperCase()}</div>}
              <h3>{profile.display_name || profile.username}</h3><span className="tag">@{profile.username}</span>
              <p>{profile.bio || 'Bio belum ditambahkan.'}</p>
              <button type="button" onClick={() => openCreatorProfile(profile)}>Lihat profil</button>
            </article>
          ))}
          {!profileLoading && filteredProfiles.length === 0 && <div style={{gridColumn:'1 / -1',textAlign:'center',padding:'24px'}}>
            <h3>{search ? 'Profil tidak ditemukan' : 'Belum ada profil kreator'}</h3>
            <p>{search ? 'Coba kata kunci lain.' : 'Profil nyata akan muncul setelah kreator mendaftar dan menyimpan profilnya. Tidak ada kartu contoh.'}</p>
          </div>}
        </section>

        <h2 className="section-title" id="komunitas">Komunitas & kanal kreator</h2>
        <p>
          Kreator bisa membangun komunitas di platform favorit. Tautan undangan atau kanal khusus akan ditampilkan di profil kreator setelah profilnya diaktifkan.
        </p>
        <section className="cards" aria-label="Platform komunitas">
          {PLATFORMS.map((platform) => (
            <article key={platform.id} className="card">
              <div className="avatar">{platform.avatar}</div>
              <h3>{platform.name}</h3>
              <span className="tag">{platform.tag}</span>
              <p>{platform.desc}</p>
              <a
                className="platform-link"
                href={platform.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {platform.linkLabel}
              </a>
            </article>
          ))}
        </section>

        <h2 className="section-title" id="bantuan">Bantuan & FAQ</h2>
        <section className="faq-list" aria-label="Pertanyaan yang sering diajukan">
          <details className="faq-item">
            <summary>Apakah donasi dan pencairan dana sudah aktif?</summary>
            <p>Belum. Website ini belum memproses pembayaran, donasi QRIS/e-wallet, atau pencairan dana. Jangan mengirim uang melalui halaman ini.</p>
          </details>
          <details className="faq-item">
            <summary>Bagaimana cara membuat profil kreator?</summary>
            <p>Masuk atau daftar menggunakan email setelah Supabase dikonfigurasi. Isi username unik, nama tampilan, bio, lalu tekan Simpan profil.</p>
          </details>
          <details className="faq-item">
            <summary>Bagaimana cara mengganti foto profil?</summary>
            <p>Pilih gambar JPG, PNG, atau WebP berukuran maksimal 2MB. Upload memerlukan bucket Storage bernama avatars dan kebijakan yang sesuai di Supabase.</p>
          </details>
          <details className="faq-item">
            <summary>Mengapa saya tidak bisa masuk atau daftar?</summary>
            <p>Pastikan variabel VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sudah diatur, metode email aktif, dan URL situs sudah dimasukkan ke konfigurasi autentikasi Supabase.</p>
          </details>
          <details className="faq-item">
            <summary>Apakah profil saya bisa dilihat pengunjung lain?</summary>
            <p>Profil yang berhasil disimpan dapat ditampilkan sesuai kebijakan akses database. Admin proyek perlu memeriksa aturan Row Level Security (RLS) sebelum situs dipublikasikan.</p>
          </details>
        </section>

        <p className="notice">
          Informasi: login dan pendaftaran akun tersedia setelah konfigurasi Supabase. Profil kreator, donasi QRIS/e-wallet, dan pencairan dana belum aktif. Jangan mengirim uang melalui halaman ini sampai integrasi pembayaran disiapkan.
        </p>
      </main>

      <footer>
        © 2026 Dqau Donate · Dibuat untuk mendukung kreativitas.
      </footer>

      {/* Auth Modal */}
      {modalOpen && (
        <div
          className="modal"
          id="authModal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="authTitle"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalOpen(false);
              setAuthMessage({ text: '', isError: false });
            }
          }}
        >
          <div className="dialog" tabIndex={-1}>
            <button
              className="close"
              id="closeModal"
              type="button"
              aria-label="Tutup"
              onClick={() => {
                setModalOpen(false);
                setAuthMessage({ text: '', isError: false });
              }}
            >
              ×
            </button>
            <h2 id="authTitle">
              {authMode === 'signup' ? 'Buat akun Dqau Donate' : 'Masuk ke Dqau Donate'}
            </h2>
            <p id="authSubtitle">
              {authMode === 'signup'
                ? 'Daftar dengan email dan kata sandi.'
                : 'Masuk menggunakan akun yang sudah terdaftar.'}
            </p>

            <form id="authForm" onSubmit={handleAuthSubmit}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label htmlFor="password">Kata sandi (minimal 6 karakter)</label>
              <input
                id="password"
                type="password"
                autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                minLength={6}
                required
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <p
                className="message"
                id="authMessage"
                role="status"
                style={{ color: authMessage.isError ? '#ffaaa9' : '#c7b3ff' }}
              >
                {authMessage.text}
              </p>

              <div className="actions">
                <button type="submit" id="submitAuth" disabled={loading}>
                  {authMode === 'signup' ? 'Daftar' : 'Masuk'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  id="switchMode"
                  disabled={loading}
                  onClick={() => {
                    setAuthMode((prev) => (prev === 'login' ? 'signup' : 'login'));
                    setAuthMessage({ text: '', isError: false });
                  }}
                >
                  {authMode === 'signup' ? 'Saya sudah punya akun' : 'Buat akun'}
                </button>
              </div>
            </form>

            <div className="social-auth">
              <div className="or-divider">atau lanjutkan dengan</div>
              <div className="social-grid">
                <button
                  type="button"
                  className="secondary"
                  disabled={loading}
                  onClick={() => handleOAuth('google')}
                >
                  Google
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={loading}
                  onClick={() => handleOAuth('facebook')}
                >
                  Facebook
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={loading}
                  onClick={() => handleOAuth('tiktok')}
                >
                  TikTok
                </button>
                <button
                  type="button"
                  className="secondary"
                  id="showPhoneAuth"
                  onClick={() => {
                    setShowPhoneAuth(true);
                    setAuthMessage({
                      text: 'Masukkan nomor HP dengan kode negara, misalnya +62.',
                      isError: false,
                    });
                  }}
                >
                  Nomor HP
                </button>
              </div>
            </div>

            {showPhoneAuth && (
              <section id="phoneAuthPanel">
                <label htmlFor="phoneNumber">Nomor HP (format internasional, contoh +62812...)</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+62812..."
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <div className="actions">
                  <button
                    type="button"
                    id="sendPhoneCode"
                    disabled={phoneLoading}
                    onClick={handleSendPhoneCode}
                  >
                    Kirim kode SMS
                  </button>
                </div>

                <label htmlFor="phoneCode">Kode verifikasi SMS</label>
                <input
                  id="phoneCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Masukkan kode OTP"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                />
                <div className="actions">
                  <button
                    type="button"
                    id="verifyPhoneCode"
                    disabled={phoneLoading}
                    onClick={handleVerifyPhoneCode}
                  >
                    Verifikasi & masuk
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    id="hidePhoneAuth"
                    onClick={() => {
                      setShowPhoneAuth(false);
                      setAuthMessage({ text: '', isError: false });
                    }}
                  >
                    Kembali
                  </button>
                </div>
                <p className="muted-note">
                  Nomor HP perlu layanan SMS yang aktif di Supabase. Biaya SMS dari penyedia dapat berlaku.
                </p>
              </section>
            )}

            <p className="muted-note">
              Jangan gunakan kata sandi yang sama dengan akun penting kamu. Login sosial perlu diaktifkan di Supabase terlebih dahulu.
            </p>
          </div>
        </div>
      )}

      {selectedProfile && (
        <div
          className="modal"
          id="creatorDialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="creatorDialogTitle"
          onClick={closeCreatorProfile}
        >
          <div className="alert-dialog" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
            {selectedProfile.avatar_url ? <img className="creator-avatar-image profile-detail-avatar" src={selectedProfile.avatar_url} alt={selectedProfile.username} /> : <div className="avatar" style={{width:88,height:88,borderRadius:18,display:'grid',placeItems:'center'}}>👤</div>}
            <h3 id="creatorDialogTitle">{selectedProfile.display_name || selectedProfile.username}</h3>
            <span className="tag">@{selectedProfile.username}</span>
            <p>{selectedProfile.bio || "Kreator ini belum menambahkan bio."}</p>
            <p>Ini profil kreator dari database Dqua Donate. Album, postingan, dan donasi belum tersedia di halaman ini.</p>
            <button type="button" onClick={closeCreatorProfile}>
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Alert modal (replaces window.alert for clean iframe compliance) */}
      {alertInfo && (
        <div
          className="modal"
          id="alertDialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="alertDialogTitle"
          onClick={() => setAlertInfo(null)}
        >
          <div className="alert-dialog" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
            <h3 id="alertDialogTitle">Pemberitahuan</h3>
            <p>{alertInfo}</p>
            <button type="button" onClick={() => setAlertInfo(null)}>
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
