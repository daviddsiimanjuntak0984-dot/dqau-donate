import { useEffect, useRef, useState } from 'react';

interface AlertPayload {
  donor_name: string;
  amount: number;
  message: string;
  isTest?: boolean;
}

/**
 * Transparent OBS Browser Source.
 * Live donation events are intentionally not subscribed here until the
 * database schema and per-creator authorization can be verified.
 */
export function OverlayView() {
  const [alert, setAlert] = useState<AlertPayload | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<number | undefined>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source === window) return;
      const data = event.data as { type?: string; payload?: AlertPayload } | null;
      if (data?.type !== 'DQUA_TEST_ALERT' || !data.payload) return;
      if (typeof data.payload.donor_name !== 'string' || typeof data.payload.amount !== 'number') return;

      setAlert({ ...data.payload, isTest: true });
      setVisible(true);
      if (hideTimer.current !== undefined) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setVisible(false), 5200);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        void audioRef.current.play().catch(() => undefined);
      }
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      if (hideTimer.current !== undefined) window.clearTimeout(hideTimer.current);
    };
  }, []);

  return (
    <main className="overlay-root" aria-label="Dqua Donate alert overlay">
      <audio ref={audioRef} src="/alert-chime.mp3" preload="auto" />
      <section className={`overlay-alert ${visible ? 'is-visible' : ''}`} role="status" aria-live="polite">
        <div className="oa-left" aria-hidden="true">✦</div>
        <div className="oa-body">
          {alert?.isTest && <div className="oa-test-label">PREVIEW / TEST</div>}
          <div className="oa-line oa-name">{alert?.donor_name || 'Dukung Kreator'}</div>
          <div className="oa-line oa-amount">
            {alert ? `Rp ${alert.amount.toLocaleString('id-ID')}` : ''}
          </div>
          <div className="oa-line oa-message">{alert?.message || ''}</div>
        </div>
      </section>
    </main>
  );
}

export function OverlaySettings({ userId, username }: { userId: string; username: string }) {
  const storageKey = `dqua-overlay-preview:${userId}`;
  const [token, setToken] = useState('');
  const [overlayWindow, setOverlayWindow] = useState<Window | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      let saved = window.localStorage.getItem(storageKey);
      if (!saved) {
        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        saved = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
        window.localStorage.setItem(storageKey, saved);
      }
      setToken(saved);
    } catch {
      setToken('');
    }
  }, [storageKey]);

  const overlayUrl = `${window.location.origin}/?overlay=1&creator=${encodeURIComponent(username)}&token=${encodeURIComponent(token)}`;

  const openOverlay = () => {
    if (!token) return;
    const opened = window.open(overlayUrl, '_blank', 'popup,width=960,height=540');
    if (opened) setOverlayWindow(opened);
  };

  const testAlert = () => {
    const payload: AlertPayload = {
      donor_name: 'Pendukung Demo',
      amount: 20000,
      message: 'Ini hanya test alert — bukan transaksi nyata.',
      isTest: true,
    };
    let target = overlayWindow;
    if (!target || target.closed) {
      target = window.open(overlayUrl, '_blank', 'popup,width=960,height=540');
      if (target) setOverlayWindow(target);
    }
    if (!target) {
      window.alert('Izinkan pop-up untuk menguji overlay Dqua Donate.');
      return;
    }
    window.setTimeout(() => {
      try {
        target?.postMessage({ type: 'DQUA_TEST_ALERT', payload }, window.location.origin);
      } catch {
        // The overlay can be reopened and tested again if the browser blocks the message.
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
          <h3 id="overlaySettingsTitle">Live Streaming Overlay</h3>
          <p>Tambahkan URL ini sebagai Browser Source di OBS Studio. Saat ini tersedia preview/test alert; event donasi nyata belum terhubung.</p>
        </div>
      </div>
      <label htmlFor="dquaOverlayUrl">URL Browser Source</label>
      <input id="dquaOverlayUrl" className="search" readOnly value={token ? overlayUrl : 'Overlay belum siap di browser ini'} />
      <div className="overlay-settings-actions">
        <button className="btn btn-primary" type="button" onClick={openOverlay} disabled={!token}>Buka overlay</button>
        <button className="btn btn-ghost" type="button" onClick={copyUrl} disabled={!token}>{copied ? 'URL disalin ✓' : 'Salin URL'}</button>
        <button className="btn btn-ghost" type="button" onClick={testAlert} disabled={!token}>Test Alert (Preview)</button>
      </div>
      <p className="overlay-settings-note">Token ini belum divalidasi oleh backend dan tidak membatasi akses. Jangan gunakan sebagai URL donasi live sampai validasi token dan pengiriman event aman selesai dibuat.</p>
    </section>
  );
}
