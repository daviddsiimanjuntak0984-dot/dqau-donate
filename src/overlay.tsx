import { useEffect, useState, useRef } from 'react';
import { supabase } from './supabase';
import { showToast } from './services/toast';

interface DonationPayload {
  donor_name: string;
  amount: string | number;
  message: string;
  isTest?: boolean;
}

export default function Overlay() {
  const [donation, setDonation] = useState<DonationPayload | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playCuteChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;
      if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);

      const now = ctx.currentTime;
      // Cute 3-tone cheerful Saweria/Trakteer chime: C5 -> E5 -> G5
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.3);
      });
    } catch {
      // Audio is an enhancement; browser autoplay policies should not fail the alert
    }
  };

  const triggerDonationAlert = (data: DonationPayload) => {
    const formattedAmount = typeof data.amount === 'number'
      ? 'Rp ' + data.amount.toLocaleString('id-ID')
      : String(data.amount);

    setDonation({
      ...data,
      amount: formattedAmount,
    });

    playCuteChime();

    // Hilangkan notifikasi setelah 6 detik
    setTimeout(() => {
      setDonation(null);
    }, 6000);
  };

  // Simulasi atau fungsi Realtime Supabase
  useEffect(() => {
    // Add transparent overlay body class
    document.documentElement.classList.add('dqua-overlay-mode');
    document.body.classList.add('dqua-overlay-mode');

    // Tampilkan notifikasi pertama setelah 1.5 detik agar langsung terlihat saat dibuka
    const initialTimer = setTimeout(() => {
      triggerDonationAlert({
        donor_name: "Anonim Lucu",
        amount: "Rp 50.000",
        message: "Semangat terus bang streamernya! Main game horor dong."
      });
    }, 1500);

    // Untuk test tampilan secara lokal, kita buat simulasi muncul setiap 10 detik
    const testInterval = setInterval(() => {
      const demoDonors = [
        { donor_name: "Anonim Lucu", amount: "Rp 50.000", message: "Semangat terus bang streamernya! Main game horor dong." },
        { donor_name: "Fans Setia 💖", amount: "Rp 100.000", message: "Karyanya keren banget! Sukses terus ya." },
        { donor_name: "Sobat Santai", amount: "Rp 25.000", message: "Titip salam buat kucingnya bang!" },
      ];
      const randomItem = demoDonors[Math.floor(Math.random() * demoDonors.length)];
      triggerDonationAlert(randomItem);
    }, 10000);

    // Mendengarkan pesan postMessage dari preview test di browser
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'DQUA_TEST_ALERT' && event.data.payload) {
        triggerDonationAlert(event.data.payload);
      }
    };
    window.addEventListener('message', onMessage);

    // Supabase Realtime broadcast jika token tersedia di URL
    const query = new URLSearchParams(window.location.search);
    const token = query.get('token');
    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (token) {
      channel = supabase.channel('dqua-overlay:' + token, { config: { private: true } });
      channel.on('broadcast', { event: 'donation_paid' }, (msg) => {
        if (msg.payload) triggerDonationAlert(msg.payload);
      });
      channel.subscribe();
    }

    return () => {
      document.documentElement.classList.remove('dqua-overlay-mode');
      document.body.classList.remove('dqua-overlay-mode');
      clearTimeout(initialTimer);
      clearInterval(testInterval);
      window.removeEventListener('message', onMessage);
      if (channel) void supabase.removeChannel(channel);
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    };
  }, []);

  if (!donation) return null; // Layar kosong (transparan) di OBS jika tidak ada donasi

  return (
    // Background transparan, konten di tengah
    <div className="h-screen w-screen flex items-center justify-center bg-transparent overflow-hidden">
      
      {/* Container Alert - Menggunakan animasi pop-in yang lucu */}
      <div className="relative text-center animate-pop-in">
        
        {/* GIF / Maskot Lucu (Bisa diganti dengan aset kamu sendiri) */}
        <div className="mx-auto w-40 h-40 animate-float-cute mb-[-20px] relative z-10">
          <img 
            src="https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif" 
            alt="Mascot" 
            className="w-full h-full object-contain drop-shadow-xl border-4 border-white rounded-full bg-white"
          />
        </div>
        
        {/* Kotak Pesan Donasi */}
        <div className="bg-white/95 backdrop-blur border-4 border-indigo-400 rounded-3xl p-6 shadow-2xl max-w-md mx-auto pt-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-500 drop-shadow-sm">
            {donation.donor_name}
          </h1>
          <div className="my-2 text-2xl font-bold text-green-500 bg-green-100 rounded-full py-1 px-4 inline-block">
            Berdonasi {donation.amount}
          </div>
          <p className="mt-3 text-lg text-gray-700 font-medium italic">
            "{donation.message}"
          </p>
        </div>
        
      </div>
    </div>
  );
}

export { Overlay as OverlayView };

type TokenResponse = { overlay_token?: string; error?: string; is_active?: boolean };

export function OverlaySettings({ userId, username }: { userId: string; username: string }) {
  const [token, setToken] = useState('');
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenMessage, setTokenMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [previewWindow, setPreviewWindow] = useState<Window | null>(null);

  const requestToken = async (rotate = false) => {
    setTokenLoading(true);
    setTokenMessage('');
    try {
      const { data, error } = await supabase.functions.invoke('create-overlay-token', {
        body: rotate ? { rotate: true } : {},
      });
      if (error) throw error;
      const result = data as TokenResponse | null;
      if (!result || typeof result.overlay_token !== 'string' || result.overlay_token.length !== 64) {
        throw new Error(result?.error || 'Token overlay belum tersedia.');
      }
      setToken(result.overlay_token);
      setTokenMessage(rotate ? 'Token berhasil dirotasi; URL lama tidak lagi menerima alert baru.' : 'Overlay live terhubung ke token server.');
    } catch {
      setToken('');
      setTokenMessage('Token live belum tersedia. Pastikan migration dan Edge Function overlay sudah dipasang.');
    } finally {
      setTokenLoading(false);
    }
  };

  useEffect(() => {
    void requestToken();
  }, [userId]);

  const overlayUrl = window.location.origin + '/overlay?token=' + encodeURIComponent(token);
  const previewUrl = window.location.origin + '/overlay?preview=1&creator=' + encodeURIComponent(username);

  const openLiveOverlay = () => {
    window.open(overlayUrl, '_blank', 'popup,width=960,height=540');
  };

  const testAlert = () => {
    const payload = {
      donor_name: 'Pendukung Demo',
      amount: 'Rp 20.000',
      message: 'Ini hanya test alert — Saweria & Trakteer style!',
    };
    let target = previewWindow;
    if (!target || target.closed) {
      target = window.open(previewUrl, '_blank', 'popup,width=960,height=540');
      if (target) setPreviewWindow(target);
    }
    if (!target) {
      showToast('Izinkan pop-up untuk menguji overlay Dqua Donate.', 'warning');
      return;
    }
    window.setTimeout(() => {
      try {
        target?.postMessage({ type: 'DQUA_TEST_ALERT', payload }, window.location.origin);
      } catch {
        // Reopen preview and test again
      }
    }, 900);
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(overlayUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Salin URL overlay ini secara manual:', overlayUrl);
    }
  };

  return (
    <section className="overlay-settings" aria-labelledby="overlaySettingsTitle">
      <div className="overlay-settings-heading">
        <span className="overlay-settings-icon" aria-hidden="true">✦</span>
        <div>
          <h3 id="overlaySettingsTitle">Live Streaming Overlay (Gaya Saweria / Trakteer)</h3>
          <p>Notifikasi membal lucu dengan maskot GIF, suara chime, dan background transparan untuk OBS Studio Browser Source.</p>
        </div>
      </div>
      <label htmlFor="dquaOverlayUrl">URL Browser Source (live / preview di OBS)</label>
      <input id="dquaOverlayUrl" className="search" readOnly value={token ? overlayUrl : window.location.origin + '/overlay'} />
      <div className="overlay-settings-actions">
        <button className="btn btn-primary btn-cute" type="button" onClick={openLiveOverlay}>Buka overlay (/overlay)</button>
        <button className="btn btn-ghost btn-cute" type="button" onClick={copyUrl}>{copied ? 'URL disalin ✓' : 'Salin URL overlay'}</button>
        <button className="btn btn-ghost btn-cute" type="button" onClick={testAlert}>Test Alert (Animasi Saweria)</button>
        {token && (
          <button
            className="btn btn-ghost btn-cute"
            type="button"
            disabled={tokenLoading}
            onClick={() => {
              if (window.confirm('Rotasi token akan memutuskan URL Browser Source sebelumnya. Lanjutkan?')) {
                void requestToken(true);
              }
            }}
          >
            Rotasi token
          </button>
        )}
      </div>
      <p className="overlay-settings-note" role="status">
        {tokenLoading ? 'Memeriksa token overlay…' : (tokenMessage || 'Overlay siap digunakan di OBS Studio atau browser.')}
      </p>
    </section>
  );
}
