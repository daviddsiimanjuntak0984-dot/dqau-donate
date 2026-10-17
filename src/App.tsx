import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import type { User } from '@supabase/supabase-js';
import { OverlaySettings, OverlayView } from './overlay';
import { DonationForm } from './DonationForm';

interface CreatorProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  created_at: string;
}

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
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<CreatorProfile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setProfileLoading(false);
      setProfileMessage('Koneksi Supabase belum dikonfigurasi. Login dan data kreator belum tersedia sampai variabel deployment diatur.');
      return;
    }
    const loadProfiles = async () => {
      setProfileLoading(true);
      const { data, error } = await supabase.from('profiles').select('id, username, display_name, bio, avatar_url, created_at').order('created_at', { ascending: false });
      if (!error && data) setProfiles(data as CreatorProfile[]);
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
    if (!user) {
      setProfileName('');
      setUsername('');
      setBio('');
      setAvatarUrl('');
      setAvatarPreview(null);
      return;
    }
    const loadMyProfile = async () => {
      const { data } = await supabase.from('profiles').select('username, display_name, bio, avatar_url').eq('id', user.id).maybeSingle();
      if (data) {
        setProfileName(data.display_name || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
        setAvatarPreview(data.avatar_url || null);
      }
    };
    void loadMyProfile();
  }, [user]);

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
    if (!isSupabaseConfigured) {
      setAuthMessage({ text: 'Login belum tersedia: konfigurasi Supabase pada Cloudflare Pages belum lengkap. Admin perlu mengatur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY, lalu deploy ulang.', isError: true });
      return;
    }
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
    if (!isSupabaseConfigured) {
      setAuthMessage({ text: 'Login belum tersedia karena konfigurasi Supabase di deployment belum lengkap.', isError: true });
      return;
    }
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
    if (!isSupabaseConfigured) {
      setAuthMessage({ text: 'Login nomor HP belum tersedia karena konfigurasi Supabase di deployment belum lengkap.', isError: true });
      return;
    }
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
    if (!isSupabaseConfigured) {
      setAuthMessage({ text: 'Verifikasi nomor HP belum tersedia karena konfigurasi Supabase di deployment belum lengkap.', isError: true });
      return;
    }
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
    if (!file.type.startsWith('image/')) { setProfileMessage('Hanya file gambar yang diizinkan.'); return null; }
    if (file.size > 2 * 1024 * 1024) { setProfileMessage('Ukuran maksimal avatar 2MB.'); return null; }
    setAvatarUploading(true);
    setProfileMessage('Mengunggah avatar...');
    try {
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
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
    if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
      setProfileMessage('Username harus 3–24 karakter: huruf kecil, angka, atau garis bawah.');
      return;
    }
    setSavingProfile(true);
    setProfileMessage('');
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username: cleanUsername,
      display_name: profileName.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl.trim() || null,
    });
    if (error) {
      setProfileMessage((error as any).code === '23505' ? 'Username sudah dipakai. Pilih username lain.' : 'Gagal menyimpan: ' + (error as any).message);
    } else {
      setProfileMessage('Profil berhasil disimpan.');
      const { data } = await supabase.from('profiles').select('id, username, display_name, bio, avatar_url, created_at').order('created_at', { ascending: false });
      if (data) setProfiles(data as CreatorProfile[]);
    }
    setSavingProfile(false);
  };

  const scrollToCreators = () => {
    const elem = document.getElementById('kreator');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const overlayMode = new URLSearchParams(window.location.search).get('overlay') === '1';
  if (overlayMode) return <OverlayView />;

  return (
    <>
      <header>
        <div className="container header-inner">
          <div className="logo" aria-hidden>
            <span>✦</span>
            <span>Dqau Donate</span>
          </div>

          <nav className="nav" aria-label="Main navigation">
            <a href="#kreator">Kreator</a>
            <a href="#komunitas">Komunitas</a>
            <a href="#cards">Daftar</a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="account" id="accountStatus" aria-live="polite">
              {user ? user.email || 'Sudah masuk' : 'Belum masuk'}
            </div>

            <button
              className="btn btn-primary"
              id="accountButton"
              type="button"
              disabled={loading}
              onClick={handleAccountClick}
            >
              {user ? 'Keluar' : 'Masuk / Daftar'}
            </button>

            <button
              className="menu-toggle"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(v => !v)}
            >
              ☰
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div style={{ padding: '8px 5%', borderTop: '1px solid rgba(255,255,255,0.02)', background: 'rgba(0,0,0,0.35)' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="#kreator" onClick={() => setIsMenuOpen(false)}>Kreator</a>
              <a href="#komunitas" onClick={() => setIsMenuOpen(false)}>Komunitas</a>
              <a href="#cards" onClick={() => setIsMenuOpen(false)}>Daftar</a>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className="hero">
          <small>✦ RUANG UNTUK PARA KREATOR</small>
          <h1>Apresiasi karya.<br />Dukung kreator.</h1>
          <p>Temukan kreator favoritmu dan tunjukkan dukungan untuk karya mereka.</p>
          <button className="btn btn-primary" type="button" onClick={scrollToCreators}>
            Jelajahi kreator ↓
          </button>
        </section>

        <h2 className="section-title" id="kreator">Temukan kreator</h2>
        <p>Dukungan kecil bisa berarti besar.</p>
        <input
          className="search"
          id="search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau kategori kreator..."
        />

        {user && (
          <section className="profile-editor">
            <h3>Profil kreator kamu</h3>
            <p>Profil ini disimpan ke database dan ditampilkan kepada pengunjung.</p>
            <form onSubmit={saveProfile}>
              <label htmlFor="creatorDisplayName">Nama tampilan</label>
              <input
                id="creatorDisplayName"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                maxLength={60}
                placeholder="Nama yang terlihat di profil"
              />

              <label htmlFor="creatorUsername">Username unik</label>
              <input
                id="creatorUsername"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={24}
                placeholder="username_kamu"
              />

              <label htmlFor="creatorBio">Bio</label>
              <textarea
                id="creatorBio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Ceritakan tentang karya kamu"
              />

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

              <button className="btn btn-primary" type="submit" disabled={savingProfile}>{savingProfile ? 'Menyimpan…' : 'Simpan profil'}</button>
              {profileMessage && <p className="message" role="status">{profileMessage}</p>}
            </form>
            <OverlaySettings userId={user.id} username={username || user.email || user.id} />
          </section>
        )}

        <section className="cards" id="cards">
          {profileLoading ? <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px' }}>Memuat profil kreator…</p> : filteredProfiles.map(profile => (
            <article key={profile.id} className="card creator-profile-card">
              {profile.avatar_url ? <img className="creator-avatar-image" src={profile.avatar_url} alt={profile.display_name || profile.username} /> : <div className="avatar">{(profile.display_name || profile.username || '').charAt(0).toUpperCase()}</div>}
              <h3>{profile.display_name || profile.username}</h3>
              <span className="tag">@{profile.username}</span>
              <p>{profile.bio || 'Bio belum ditambahkan.'}</p>
              <button className="btn btn-ghost" type="button" onClick={() => setSelectedProfile(profile)}>Lihat profil</button>
            </article>
          ))}
          {!profileLoading && filteredProfiles.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px' }}>
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

        <p className="notice">
          Informasi: pembayaran baru bisa diproses setelah kredensial Midtrans Sandbox dikonfigurasi. Jangan transfer uang secara manual atau menganggap redirect checkout sebagai bukti pembayaran.
        </p>
      </main>

      <footer>
        © 2026 Dqau Donate · Dibuat untuk mendukung kreativitas.
      </footer>

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
          <div className="dialog">
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
                autoFocus
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
                <button className="btn btn-primary" type="submit" id="submitAuth" disabled={loading}>
                  {authMode === 'signup' ? 'Daftar' : 'Masuk'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
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
                  className="btn btn-ghost"
                  disabled={loading}
                  onClick={() => handleOAuth('google')}
                >
                  Google
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={loading}
                  onClick={() => handleOAuth('facebook')}
                >
                  Facebook
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={loading}
                  onClick={() => handleOAuth('tiktok')}
                >
                  TikTok
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
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
                    className="btn btn-primary"
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
                    className="btn btn-primary"
                  >
                    Verifikasi & masuk
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
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
          role="dialog"
          aria-modal="true"
          aria-labelledby="creatorDialogTitle"
          onClick={() => setSelectedProfile(null)}
        >
          <div className="alert-dialog" onClick={(e) => e.stopPropagation()}>
            {selectedProfile.avatar_url ? (
              <img className="creator-avatar-image profile-detail-avatar" src={selectedProfile.avatar_url} alt={selectedProfile.username} />
            ) : (
              <div className="avatar">{(selectedProfile.display_name || selectedProfile.username || '').charAt(0).toUpperCase()}</div>
            )}
            <h3 id="creatorDialogTitle">{selectedProfile.display_name || selectedProfile.username}</h3>
            <span className="tag">@{selectedProfile.username}</span>
            <p>{selectedProfile.bio || 'Kreator ini belum menambahkan bio.'}</p>
            <DonationForm creatorId={selectedProfile.id} creatorName={selectedProfile.display_name || selectedProfile.username} />
            <button className="btn btn-primary" type="button" onClick={() => setSelectedProfile(null)}>
              Mengerti
            </button>
          </div>
        </div>
      )}

      {alertInfo && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setAlertInfo(null)}
        >
          <div className="alert-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Pemberitahuan</h3>
            <p>{alertInfo}</p>
            <button className="btn btn-primary" type="button" onClick={() => setAlertInfo(null)}>
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
