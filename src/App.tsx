import React, { useState, useEffect, useRef } from 'react';
import { initializeSupabase, isSupabaseConfigured, supabase } from './supabase';
import { useDebounce } from './hooks/useDebounce';
import { useFocusTrap } from './hooks/useFocusTrap';
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
  const [supabaseReady, setSupabaseReady] = useState(isSupabaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState<{ text: string; isError: boolean }>({ text: '', isError: false });
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState('');
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
  const [donateOpen, setDonateOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<'about' | 'links' | 'posts'>('about');
  const [entranceVisible, setEntranceVisible] = useState(true);
  const authDialogRef = useRef<HTMLDivElement>(null);
  const creatorDialogRef = useRef<HTMLDivElement>(null);
  const alertDialogRef = useRef<HTMLDivElement>(null);
  const donateDialogRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchInput, 250);
  const debouncedUsername = useDebounce(username.trim().toLowerCase(), 350);

  useFocusTrap(modalOpen, authDialogRef, () => { setModalOpen(false); setAuthMessage({ text: '', isError: false }); });
  useFocusTrap(Boolean(selectedProfile) && !donateOpen && !alertInfo, creatorDialogRef, () => closeCreatorProfile());
  useFocusTrap(Boolean(alertInfo), alertDialogRef, () => setAlertInfo(null));
  useFocusTrap(donateOpen, donateDialogRef, () => setDonateOpen(false));

  useEffect(() => {
    let active = true;
    void initializeSupabase().then(() => {
      if (active) setSupabaseReady(isSupabaseConfigured);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) { setEntranceVisible(false); return; }
    const timeoutId = window.setTimeout(() => setEntranceVisible(false), 1150);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!supabaseReady) {
      setProfileLoading(false);
      return;
    }
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
  }, [supabaseReady]);

  useEffect(() => {
    if (!user) { setProfileName(''); setUsername(''); setBio(''); setAvatarUrl(''); setAvatarPreview(null); return; }
    const loadMyProfile = async () => {
      const { data } = await supabase.from('profiles').select('username, display_name, bio, avatar_url').eq('id', user.id).maybeSingle();
      if (data) { setProfileName(data.display_name || ''); setUsername(data.username || ''); setBio(data.bio || ''); setAvatarUrl(data.avatar_url || ''); setAvatarPreview(data.avatar_url || null); }
    };
    void loadMyProfile();
  }, [user]);

  useEffect(() => { setSearch(debouncedSearch); }, [debouncedSearch]);

  useEffect(() => {
    const value = debouncedUsername;
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
  }, [debouncedUsername, user]);

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
      setAuthMessage({ text: 'Supabase belum dikonfigurasi. Atur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di pengaturan hosting.', isError: true });
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
          options: { emailRedirectTo: import.meta.env.VITE_SUPABASE_REDIRECT_URL?.trim() || window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setPendingConfirmationEmail(email.trim());
          setAuthMessage({
            text: 'Permintaan pendaftaran diterima. Buka email konfirmasi dari Dqau Donate untuk mengaktifkan akun. Jika belum ada, periksa Spam/Promosi atau kirim ulang email di bawah.',
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

  const handleResendConfirmation = async () => {
    const targetEmail = (pendingConfirmationEmail || email).trim();
    if (!targetEmail) {
      setAuthMessage({ text: 'Masukkan alamat email yang digunakan saat mendaftar.', isError: true });
      return;
    }
    setLoading(true);
    setAuthMessage({ text: 'Mengirim ulang email konfirmasi…', isError: false });
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: { emailRedirectTo: import.meta.env.VITE_SUPABASE_REDIRECT_URL?.trim() || window.location.origin },
      });
      if (error) throw error;
      setPendingConfirmationEmail(targetEmail);
      setAuthMessage({
        text: 'Permintaan kirim ulang berhasil. Periksa Kotak Masuk, Spam, dan Promosi. Jika email masuk tetapi tidak ada tombol/link konfirmasi, template email Supabase perlu diperbaiki.',
        isError: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim ulang email konfirmasi.';
      setAuthMessage({ text: msg, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    if (!isSupabaseConfigured) {
      setAuthMessage({ text: 'Supabase belum dikonfigurasi. Atur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di pengaturan hosting.', isError: true });
      return;
    }
    setLoading(true);
    setAuthMessage({ text: 'Menghubungkan ke ' + provider + '...', isError: false });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: import.meta.env.VITE_SUPABASE_REDIRECT_URL?.trim() || window.location.origin },
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
      setAuthMessage({ text: 'Supabase belum dikonfigurasi. Atur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di pengaturan hosting.', isError: true });
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
      setAuthMessage({ text: 'Supabase belum dikonfigurasi. Atur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di pengaturan hosting.', isError: true });
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
    if (debouncedUsername !== cleanUsername || usernameStatus === 'checking') {
      setProfileMessage('Tunggu sampai pemeriksaan username selesai.');
      setSavingProfile(false);
      return;
    }
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
    setProfileTab('about');
    setSelectedProfile(profile);
  };

  const closeCreatorProfile = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('creator');
    window.history.replaceState({}, '', url);
    setSelectedProfile(null);
  };

  const shareProfile = async (profile: CreatorProfile) => {
    const url = new URL(window.location.href);
    url.searchParams.set('creator', profile.username);
    const shareData = { title: `${profile.display_name || profile.username} — Dqau Donate`, text: `Lihat profil @${profile.username} di Dqau Donate`, url: url.toString() };
    try {
      if (navigator.share) await navigator.share(shareData);
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(shareData.url); setAlertInfo('Tautan profil berhasil disalin.'); }
      else setAlertInfo(`Bagikan tautan ini: ${shareData.url}`);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setAlertInfo('Tidak dapat membagikan tautan otomatis. Salin URL profil dari bilah alamat.');
    }
  };

  const scrollToCreators = () => {
    const elem = document.getElementById('kreator');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {entranceVisible && <div className="entrance-overlay" role="status" aria-label="Dqau Donate sedang dibuka"><div className="entrance-mark">✦</div><strong>Dqau Donate</strong><span>Ruang untuk para kreator</span></div>}
      <header className="site-header">
        <a className="logo" href="#" aria-label="Dqau Donate beranda"><span className="brand-mark">✦</span><span>Dqau <b>Donate</b></span></a>
        <nav className="main-nav" aria-label="Navigasi utama">
          <a href="#kreator">Jelajahi</a>
          <a href="#komunitas">Komunitas</a>
          <a href="#bantuan">Bantuan</a>
        </nav>
        <div className="header-actions">
          {user && <span className="account" id="accountStatus">{user.email || 'Sudah masuk'}</span>}
          <button className="header-login" id="accountButton" type="button" disabled={loading} onClick={handleAccountClick}>
            {user ? 'Keluar' : 'Masuk'}
          </button>
        </div>
      </header>

      <main>
        <section className="hero entrance-content">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> RUANG UNTUK PARA KREATOR</div>
            <h1>Karya hebat layak<br /><span>mendapat dukungan.</span></h1>
            <p className="hero-description">Temukan orang-orang kreatif, kenali karya mereka, dan jadilah bagian dari komunitas yang mendukung proses berkarya.</p>
            <div className="hero-actions">
              <button className="hero-primary" type="button" onClick={scrollToCreators}>Jelajahi kreator <span aria-hidden="true">↗</span></button>
              <button className="hero-secondary" type="button" onClick={() => { if (user) document.getElementById('profileEditor')?.scrollIntoView({ behavior: 'smooth' }); else { setAuthMode('signup'); setAuthMessage({ text: '', isError: false }); setModalOpen(true); } }}>Jadi kreator</button>
            </div>
            <div className="hero-note"><span className="hero-note-icon">✓</span> Kenali kreator dan temukan komunitas mereka</div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
            <div className="art-glow" />
            <div className="art-star star-one">✦</div><div className="art-star star-two">✧</div>
            <div className="art-main-card">
              <div className="art-card-top"><span className="art-live-dot" /> CREATOR SPACE <span className="art-menu">•••</span></div>
              <div className="art-avatar-stack"><span className="art-avatar art-avatar-one">✍</span><span className="art-avatar art-avatar-two">♫</span><span className="art-avatar art-avatar-three">🎨</span></div>
              <div className="art-card-title">Ruang untuk berkarya</div>
              <div className="art-card-subtitle">Ide • Karya • Komunitas</div>
              <div className="art-progress"><span /></div>
              <div className="art-card-footer"><span>TERUS BERTUMBUH</span><span>✦</span></div>
            </div>
            <div className="art-float-pill"><span>✦</span> Dukung kreativitas</div>
          </div>
        </section>

        <section className="value-strip" aria-label="Tentang Dqau Donate">
          <div><span className="value-icon">◎</span><span><b>Temukan</b><small>kreator baru</small></span></div>
          <div><span className="value-icon">✧</span><span><b>Kenali</b><small>cerita dan karya</small></span></div>
          <div><span className="value-icon">↗</span><span><b>Terhubung</b><small>dengan komunitas</small></span></div>
        </section>

        <section className="creator-section" aria-labelledby="kreator">
          <div className="section-heading">
            <div><span className="section-kicker">TEMUKAN TALENTA</span><h2 className="section-title" id="kreator">Kreator pilihanmu.</h2><p>Jelajahi profil, temukan cerita, dan kenali komunitas di balik karya.</p></div>
            <span className="section-index">01 / EXPLORE</span>
          </div>
        <div className="search-wrap"><span className="search-icon" aria-hidden="true">⌕</span><input
          className="search"
          id="search"
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Cari kreator berdasarkan nama, username, atau bio"
          placeholder="Cari nama, username, atau bio kreator..."
        /><span className="search-hint">Cari berdasarkan nama, username, atau bio</span></div>

        {user && <section className="profile-editor" id="profileEditor">
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
                <input id="creatorAvatar" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="avatarHelp" onChange={handleAvatarFileChange} />
                <small id="avatarHelp" className="muted-note">JPG, PNG, atau WebP. Maksimal 2MB. Pastikan bucket avatars dan kebijakan Storage sudah disiapkan.</small>
                <div style={{ marginTop: 6 }}>
                  <small style={{ color: '#aaa3bd' }}>{avatarUploading ? 'Mengunggah avatar…' : 'Pilih gambar JPG/PNG maksimal 2MB'}</small>
                </div>
              </div>
            </div>

            <button type="submit" disabled={savingProfile || avatarUploading}>{savingProfile ? 'Menyimpan…' : avatarUploading ? 'Menunggu upload avatar…' : 'Simpan profil'}</button>
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
        </section>

        <section className="community-section"><div className="section-heading"><div><span className="section-kicker">TETAP TERHUBUNG</span><h2 className="section-title" id="komunitas">Komunitas & kanal.</h2><p>
          Kreator bisa membangun komunitas di platform favorit. Tautan undangan atau kanal khusus akan ditampilkan di profil kreator setelah profilnya diaktifkan.
        </p></div><span className="section-index">02 / CONNECT</span></div>
        <section className="cards platform-cards" aria-label="Platform komunitas">
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
        </section></section>

        <section className="faq-section"><div className="section-heading"><div><span className="section-kicker">ADA PERTANYAAN?</span><h2 className="section-title" id="bantuan">Kami bantu kamu.</h2><p>Informasi singkat tentang fitur dan cara menggunakan Dqau Donate.</p></div><span className="section-index">03 / HELP</span></div>
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
        </section></section>

        <p className="notice">
          Informasi: login dan pendaftaran akun tersedia setelah konfigurasi Supabase. Profil kreator, donasi QRIS/e-wallet, dan pencairan dana belum aktif. Jangan mengirim uang melalui halaman ini sampai integrasi pembayaran disiapkan.
        </p>
      </main>

      <footer className="site-footer"><a className="logo footer-logo" href="#"><span className="brand-mark">✦</span><span>Dqau <b>Donate</b></span></a><p>Ruang untuk mendukung kreativitas dan menghubungkan komunitas.</p><span>© 2026 Dqau Donate · Dibuat untuk mendukung kreativitas.</span></footer>

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
          <div className="dialog" ref={authDialogRef} tabIndex={-1}>
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
              {authMode === 'signup' && pendingConfirmationEmail && (
                <button
                  type="button"
                  className="secondary"
                  id="resendConfirmation"
                  disabled={loading}
                  onClick={() => void handleResendConfirmation()}
                  style={{ width: '100%', marginTop: 10 }}
                >
                  {loading ? 'Mengirim…' : 'Kirim ulang email verifikasi'}
                </button>
              )}
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
          <section className="profile-dialog" ref={creatorDialogRef} tabIndex={-1} onClick={(e) => e.stopPropagation()} aria-label={`Profil ${selectedProfile.display_name || selectedProfile.username}`}>
            <div className="profile-cover" role="img" aria-label="Sampul profil kreator"><span className="cover-caption">KREATOR DQAU</span></div>
            <div className="profile-identity">
              {selectedProfile.avatar_url ? <img className="profile-large-avatar" src={selectedProfile.avatar_url} alt={`Foto profil ${selectedProfile.display_name || selectedProfile.username}`} /> : <div className="profile-large-avatar profile-initials" aria-label="Avatar inisial">{(selectedProfile.display_name || selectedProfile.username || 'K').trim().charAt(0).toUpperCase()}</div>}
              <div className="profile-heading"><h2 id="creatorDialogTitle">{selectedProfile.display_name || selectedProfile.username}</h2><span className="profile-handle">@{selectedProfile.username}</span><span className="profile-joined">Bergabung {selectedProfile.created_at && !Number.isNaN(Date.parse(selectedProfile.created_at)) ? new Date(selectedProfile.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'di Dqau Donate'}</span></div>
              <div className="profile-actions"><button type="button" aria-label={`Dukung ${selectedProfile.display_name || selectedProfile.username}`} onClick={() => setDonateOpen(true)}>Dukung</button><button type="button" className="secondary" aria-label={`Bagikan profil ${selectedProfile.username}`} onClick={() => void shareProfile(selectedProfile)}>Bagikan</button></div>
            </div>
            <nav className="profile-tabs" role="tablist" aria-label="Bagian profil kreator">
              <button type="button" role="tab" aria-selected={profileTab === 'about'} className={profileTab === 'about' ? 'active' : ''} onClick={() => setProfileTab('about')}>Tentang</button>
              <button type="button" role="tab" aria-selected={profileTab === 'links'} className={profileTab === 'links' ? 'active' : ''} onClick={() => setProfileTab('links')}>Tautan</button>
              <button type="button" role="tab" aria-selected={profileTab === 'posts'} className={profileTab === 'posts' ? 'active' : ''} onClick={() => setProfileTab('posts')}>Postingan</button>
            </nav>
            <section className="profile-tab-panel" role="tabpanel" aria-live="polite">
              {profileTab === 'about' && <><h3>Tentang saya</h3><p>{selectedProfile.bio || 'Kreator ini belum menambahkan bio.'}</p><p className="profile-meta">Profil kreator publik di Dqau Donate.</p></>}
              {profileTab === 'links' && <><h3>Tautan kreator</h3><p>Belum ada tautan sosial yang ditambahkan ke profil ini.</p></>}
              {profileTab === 'posts' && <><h3>Postingan</h3><p>Fitur postingan belum tersedia. Bagian ini akan aktif setelah sistem posting terhubung.</p></>}
            </section>
            <button type="button" className="profile-close secondary" onClick={closeCreatorProfile}>Tutup profil</button>
          </section>
        </div>
      )}


      {donateOpen && selectedProfile && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="donateTitle" onClick={(event) => { if (event.target === event.currentTarget) setDonateOpen(false); }}>
          <section className="alert-dialog donate-dialog" ref={donateDialogRef} tabIndex={-1}>
            <button className="close" type="button" aria-label="Tutup dialog dukungan" onClick={() => setDonateOpen(false)}>×</button>
            <h3 id="donateTitle">Dukung @{selectedProfile.username}</h3>
            <p>Terima kasih ingin mendukung kreator ini. Pembayaran belum terhubung, jadi belum ada transaksi yang dapat dilakukan melalui situs ini.</p>
            <p className="donate-warning">Jangan transfer uang di luar platform atas nama Dqau Donate sebelum metode pembayaran resmi tersedia.</p>
            <button type="button" onClick={() => setDonateOpen(false)}>Mengerti</button>
          </section>
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
          <div className="alert-dialog" ref={alertDialogRef} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
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
