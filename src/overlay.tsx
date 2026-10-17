import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

interface AlertPayload {
  donor_name: string;
  amount: number;
  message: string;
  isTest?: boolean;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

/**
 * Transparent OBS Browser Source.
 * Preview events are available only with preview=1 in the URL.
 * Live alerts use a private Realtime Broadcast channel authorized by the token.
 */
export function OverlayView() {
  const query = new URLSearchParams(window.location.search);
  const token = query.get("token") || "";
  const preview = query.get("preview") === "1";
  const [alert, setAlert] = useState<AlertPayload | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<number | undefined>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const showAlert = useCallback((value: unknown, isTest: boolean) => {
    if (!isRecord(value) || typeof value.amount !== "number" || !Number.isFinite(value.amount) ||
        value.amount < 1 || typeof value.donor_name !== "string") return;
    const safeAlert: AlertPayload = {
      donor_name: value.donor_name.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 40) || "Anonim",
      amount: Math.round(value.amount),
      message: typeof value.message === "string"
        ? value.message.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, 200)
        : "",
      isTest,
    };
    setAlert(safeAlert);
    setVisible(true);
    if (hideTimer.current !== undefined) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setVisible(false), 8000);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("dqua-overlay-mode");
    document.body.classList.add("dqua-overlay-mode");
    return () => {
      document.documentElement.classList.remove("dqua-overlay-mode");
      document.body.classList.remove("dqua-overlay-mode");
    };
  }, []);

  useEffect(() => {
    if (!preview) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source === window) return;
      if (!isRecord(event.data) || event.data.type !== "DQUA_TEST_ALERT") return;
      showAlert(event.data.payload, true);
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      if (hideTimer.current !== undefined) window.clearTimeout(hideTimer.current);
    };
  }, [preview, showAlert]);

  useEffect(() => {
    if (preview || !token) return;
    const channel = supabase.channel("dqua-overlay:" + token, {
      config: { private: true },
    });
    channel.on("broadcast", { event: "donation_paid" }, (message) => {
      showAlert(message.payload, false);
    });
    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn("Dqua Donate overlay: channel authorization or connection failed.");
      }
    });
    return () => {
      if (hideTimer.current !== undefined) window.clearTimeout(hideTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [preview, token, showAlert]);

  return (
    <main className="overlay-root" aria-label="Dqua Donate alert overlay">
      <audio ref={audioRef} src="/alert-chime.mp3" preload="auto" />
      <section className={"overlay-alert " + (visible ? "is-visible" : "")} role="status" aria-live="polite">
        <div className="oa-left" aria-hidden="true">✦</div>
        <div className="oa-body">
          {alert?.isTest && <div className="oa-test-label">PREVIEW / TEST — bukan transaksi nyata</div>}
          <div className="oa-line oa-name">{alert?.donor_name || ""}</div>
          <div className="oa-line oa-amount">{alert ? "Rp " + alert.amount.toLocaleString("id-ID") : ""}</div>
          <div className="oa-line oa-message">{alert?.message || ""}</div>
        </div>
      </section>
    </main>
  );
}

type TokenResponse = { overlay_token?: string; error?: string; is_active?: boolean };

export function OverlaySettings({ userId, username }: { userId: string; username: string }) {
  const [token, setToken] = useState("");
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenMessage, setTokenMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [previewWindow, setPreviewWindow] = useState<Window | null>(null);

  const requestToken = async (rotate = false) => {
    setTokenLoading(true);
    setTokenMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("create-overlay-token", {
        body: rotate ? { rotate: true } : {},
      });
      if (error) throw error;
      const result = data as TokenResponse | null;
      if (!result || typeof result.overlay_token !== "string" || result.overlay_token.length !== 64) {
        throw new Error(result?.error || "Token overlay belum tersedia.");
      }
      setToken(result.overlay_token);
      setTokenMessage(rotate ? "Token berhasil dirotasi; URL lama tidak lagi menerima alert baru." : "Overlay live terhubung ke token server.");
    } catch {
      setToken("");
      setTokenMessage("Token live belum tersedia. Pastikan migration dan Edge Function overlay sudah dipasang.");
    } finally {
      setTokenLoading(false);
    }
  };

  useEffect(() => {
    void requestToken();
  }, [userId]);

  const overlayUrl = window.location.origin + "/?overlay=1&token=" + encodeURIComponent(token);
  const previewUrl = window.location.origin + "/?overlay=1&preview=1&creator=" + encodeURIComponent(username);

  const openLiveOverlay = () => {
    if (!token) return;
    window.open(overlayUrl, "_blank", "popup,width=960,height=540");
  };
  const testAlert = () => {
    const payload: AlertPayload = {
      donor_name: "Pendukung Demo",
      amount: 20000,
      message: "Ini hanya test alert — bukan transaksi nyata.",
      isTest: true,
    };
    let target = previewWindow;
    if (!target || target.closed) {
      target = window.open(previewUrl, "_blank", "popup,width=960,height=540");
      if (target) setPreviewWindow(target);
    }
    if (!target) {
      window.alert("Izinkan pop-up untuk menguji overlay Dqua Donate.");
      return;
    }
    window.setTimeout(() => {
      try {
        target?.postMessage({ type: "DQUA_TEST_ALERT", payload }, window.location.origin);
      } catch {
        // Reopen preview and test again if the browser blocks the message.
      }
    }, 900);
  };
  const copyUrl = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(overlayUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Salin URL overlay ini secara manual:", overlayUrl);
    }
  };

  return (
    <section className="overlay-settings" aria-labelledby="overlaySettingsTitle">
      <div className="overlay-settings-heading">
        <span className="overlay-settings-icon" aria-hidden="true">✦</span>
        <div>
          <h3 id="overlaySettingsTitle">Live Streaming Overlay</h3>
          <p>Preview bisa diuji kapan saja. Alert live hanya dikirim melalui backend setelah pembayaran diverifikasi oleh Midtrans.</p>
        </div>
      </div>
      <label htmlFor="dquaOverlayUrl">URL Browser Source (live)</label>
      <input id="dquaOverlayUrl" className="search" readOnly value={token ? overlayUrl : "Token live belum tersedia"} />
      <div className="overlay-settings-actions">
        <button className="btn btn-primary" type="button" onClick={openLiveOverlay} disabled={!token || tokenLoading}>Buka overlay live</button>
        <button className="btn btn-ghost" type="button" onClick={copyUrl} disabled={!token || tokenLoading}>{copied ? "URL disalin ✓" : "Salin URL live"}</button>
        <button
          className="btn btn-ghost"
          type="button"
          disabled={tokenLoading}
          onClick={() => {
            if (window.confirm("Rotasi token akan memutuskan URL Browser Source sebelumnya. Lanjutkan?")) {
              void requestToken(true);
            }
          }}
        >
          Rotasi token
        </button>
        <button className="btn btn-ghost" type="button" onClick={testAlert}>Test Alert (Preview)</button>
      </div>
      <p className="overlay-settings-note" role="status">
        {tokenLoading ? "Memeriksa token overlay…" : tokenMessage}
      </p>
      <p className="overlay-settings-note">Jangan membagikan URL live kepada orang lain; token URL berfungsi sebagai kredensial overlay. Gunakan URL preview untuk uji visual.</p>
    </section>
  );
}
