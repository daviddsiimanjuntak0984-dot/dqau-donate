import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

interface CreatorCard {
  id: string;
  avatar: string;
  name: string;
  tag: string;
  desc: string;
  searchTerms: string;
  buttonLabel: string;
  type: 'profile' | 'support';
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

const CREATORS: CreatorCard[] = [
  {
    id: 'kreator-baru',
    avatar: '🎨',
    name: 'Kreator Baru',
    tag: 'Kreator komunitas',
    desc: 'Tempat untuk memperkenalkan karya dan membangun komunitas.',
    searchTerms: 'kreator baru umum',
    buttonLabel: 'Lihat profil',
    type: 'profile',
  },
  {
    id: 'ilustrator',
    avatar: '🖌️',
    name: 'Ilustrator',
    tag: 'Seni & desain',
    desc: 'Ruang apresiasi bagi karya ilustrasi dan desain digital.',
    searchTerms: 'ilustrasi seni desain',
    buttonLabel: 'Dukung kreator',
    type: 'support',
  },
  {
    id: 'gamer',
    avatar: '🎮',
    name: 'Gamer',
    tag: 'Gaming & streaming',
    desc: 'Dukung kreator gaming untuk terus berkarya dan menghibur.',
    searchTerms: 'gaming game streamer',
    buttonLabel: 'Dukung kreator',
    type: 'support',
  },
];

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
  const [selectedCreator, setSelectedCreator] = useState<CreatorCard | null>(null);

  useEffect(() => {
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

  const filteredCreators = CREATORS.filter((c) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      c.name.toLowerCase().includes(query) ||
      c.tag.toLowerCase().includes(query) ||
      c.desc.toLowerCase().includes(query) ||
      c.searchTerms.toLowerCase().includes(query)
    );
  });

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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau kategori kreator..."
        />

        <section className="cards" id="cards">
          {filteredCreators.map((creator) => (
            <article key={creator.id} className="card" data-search={creator.searchTerms}>
              <div className="avatar">{creator.avatar}</div>
              <h3>{creator.name}</h3>
              <span className="tag">{creator.tag}</span>
              <p>{creator.desc}</p>
              <button
                type="button"
                className={creator.type === 'profile' ? 'profileButton' : 'supportButton'}
                onClick={() => setSelectedCreator(creator)}
              >
                {creator.buttonLabel}
              </button>
            </article>
          ))}
          {filteredCreators.length === 0 && (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
              Tidak ada kreator yang cocok dengan pencarian "{search}".
            </p>
          )}
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
          Informasi: login dan pendaftaran akun tersedia setelah konfigurasi Supabase. Profil kreator, donasi QRIS/e-wallet, dan pencairan dana belum aktif. Jangan mengirim uang melalui halaman ini.
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

      {selectedCreator && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="creatorDialogTitle"
          onClick={() => setSelectedCreator(null)}
        >
          <div className="alert-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="avatar" style={{ margin: "0 auto 12px" }}>{selectedCreator.avatar}</div>
            <h3 id="creatorDialogTitle">{selectedCreator.name}</h3>
            <span className="tag">{selectedCreator.tag}</span>
            <p>{selectedCreator.desc}</p>
            <p>
              {selectedCreator.type === 'support'
                ? 'Fitur donasi belum aktif. Jangan transfer uang melalui halaman ini.'
                : 'Profil kreator belum aktif sepenuhnya. Informasi ini masih berupa contoh.'}
            </p>
            <button type="button" onClick={() => setSelectedCreator(null)}>
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Alert modal (replaces window.alert for clean iframe compliance) */}
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
            <button type="button" onClick={() => setAlertInfo(null)}>
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
