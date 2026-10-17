import React, { useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';

interface DonationEvent {
  id?: string;
  donor_name?: string;
  amount?: number;
  message?: string;
  creator_id?: string;
  creator_username?: string;
  created_at?: string;
}

// OverlayView: a minimal, focused UI suitable for OBS Browser Source.
export function OverlayView() {
  const params = new URLSearchParams(window.location.search);
  const creator = params.get('creator') || 'unknown';
  const token = params.get('token') || '';

  const [lastAlert, setLastAlert] = useState<DonationEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Listen for postMessage test events
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      // accept only messages that look like our test shape
      if (e.data && e.data.type === 'TEST_ALERT' && e.data.payload) {
        showAlert(e.data.payload as DonationEvent);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Supabase realtime: listen to 'donations' inserts if configured.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let subscription: any = null;
    try {
      subscription = supabase
        .channel('public:donations')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'donations' }, (payload) => {
          const newRow = payload.new as DonationEvent;
          // Optionally filter by creator username/id if payload carries that info.
          if (!newRow) return;
          // If creator param provided, try to match by creator_username or creator_id
          if (creator && creator !== 'unknown') {
            if (newRow.creator_username && newRow.creator_username !== creator) return;
            if (newRow.creator_id && newRow.creator_id !== creator) return;
          }
          showAlert(newRow);
        })
        .subscribe();
    } catch (err) {
      // ignore realtime subscription errors gracefully
      // eslint-disable-next-line no-console
      console.warn('Overlay realtime subscribe failed', err);
    }
    return () => {
      if (subscription) {
        void supabase.removeChannel(subscription);
      }
    };
  }, [creator]);

  function showAlert(ev: DonationEvent) {
    setLastAlert(ev);
    setVisible(true);
    // play sound if available
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => {});
    }
    // hide after 5 seconds
    setTimeout(() => setVisible(false), 5200);
  }

  return (
    <div className="overlay-root" style={{ background: 'transparent' }}>
      <audio ref={audioRef} src="/alert-chime.mp3" preload="auto" />
      <div className={`overlay-alert ${visible ? 'is-visible' : ''}`} role="status" aria-live="polite">
        <div className="oa-left">
          <div className="oa-avatar">✦</div>
        </div>
        <div className="oa-body">
          <div className="oa-line oa-name">{lastAlert?.donor_name || 'Penggemar'}</div>
          <div className="oa-line oa-amount">{typeof lastAlert?.amount === 'number' ? `Rp ${lastAlert.amount}` : ''}</div>
          <div className="oa-line oa-message">{lastAlert?.message || ''}</div>
        </div>
      </div>
    </div>
  );
}

// OverlaySettings: shown to logged-in creators to manage overlay URL & test alerts.
export function OverlaySettings({ userId, username }: { userId: string; username: string }) {
  const storageKey = `dqau:overlay:token:${userId}`;
  const [token, setToken] = useState<string>(() => localStorage.getItem(storageKey) || '');
  const [overlayWin, setOverlayWin] = useState<Window | null>(null);
  const [recent, setRecent] = useState<DonationEvent[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [savingToken, setSavingToken] = useState(false);

  useEffect(() => {
    if (!token) return;
    localStorage.setItem(storageKey, token);
  }, [token]);

  const genToken = () => {
    try {
      const id = (crypto as any).randomUUID?.() || Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b=>b.toString(16).padStart(2,'0')).join('');
      setToken(id);
    } catch {
      setToken(String(Date.now()));
    }
  };

  const openOverlay = () => {
    const url = `${window.location.origin}/?overlay=1&creator=${encodeURIComponent(username)}&token=${encodeURIComponent(token)}`;
    const w = window.open(url, `_blank`, 'toolbar=0,location=0,menubar=0,width=800,height=450');
    setOverlayWin(w);
  };

  const testAlert = () => {
    if (!overlayWin || overlayWin.closed) {
      // open first, then send after short delay
      openOverlay();
      setTimeout(() => {
        overlayWin?.postMessage({ type: 'TEST_ALERT', payload: { donor_name: 'Tester', amount: 20000, message: 'Ini test alert' } }, '*');
      }, 600);
      return;
    }
    overlayWin.postMessage({ type: 'TEST_ALERT', payload: { donor_name: 'Tester', amount: 20000, message: 'Ini test alert' } }, '*');
  };

  const fetchRecent = async () => {
    setLoadingRecent(true);
    if (!isSupabaseConfigured) { setLoadingRecent(false); return; }
    try {
      const { data, error } = await supabase.from('donations').select('*').eq('creator_id', userId).order('created_at', { ascending: false }).limit(10);
      if (!error && data) setRecent(data as DonationEvent[]);
    } catch (err) {
      // ignore
    } finally { setLoadingRecent(false); }
  };

  useEffect(() => { void fetchRecent(); }, []);

  return (
    <div className="profile-editor">
      <h3>Overlay Donasi</h3>
      <p>Buat URL overlay untuk digunakan sebagai Browser Source di OBS. Gunakan token ini untuk membatasi akses.</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
        <input className="search" value={token} onChange={e => setToken(e.target.value)} placeholder="Token overlay (simpan aman)" />
        <button className="btn btn-ghost" type="button" onClick={genToken}>Buat token</button>
        <button className="btn btn-primary" type="button" onClick={openOverlay} disabled={!token}>Buka overlay</button>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" onClick={testAlert} disabled={!token}>Test Alert (Preview)</button>
        <a className="btn btn-ghost" href={`${window.location.origin}/?overlay=1&creator=${encodeURIComponent(username)}&token=${encodeURIComponent(token)}`} target="_blank" rel="noreferrer">Copy URL</a>
      </div>

      <h4 style={{ marginTop: 16 }}>Recent donations</h4>
      {loadingRecent ? <p>Memuat...</p> : recent.length === 0 ? <p>Tidak ada donasi tercatat.</p> : (
        <ul>
          {recent.map(d => (
            <li key={d.id}>{d.donor_name} — Rp {d.amount} — {d.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
