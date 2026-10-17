import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { initializeSupabase } from './supabase';
import './index.css';

const rootElement = document.getElementById('root');

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.info('[Dqua PWA] Service worker registered.');
      return registration;
    })
    .catch(() => {
      // PWA support is optional; never let registration failure break the app.
      console.warn('[Dqua PWA] Service worker registration failed.');
    });
}

async function bootstrap() {
  if (!rootElement) {
    console.error('[Dqua boot] Missing #root element.');
    return;
  }

  // The HTML shell includes a visible loader. Resolve the public Supabase
  // config (build-time or Pages runtime) before mounting components that query it.
  await initializeSupabase();

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  if (document.readyState === 'complete') registerServiceWorker();
  else window.addEventListener('load', registerServiceWorker, { once: true });
}

void bootstrap().catch(() => {
  if (rootElement) {
    rootElement.innerHTML = '<section role="alert" style="max-width:640px;margin:12vh auto;padding:24px;color:#f5f3ff;font-family:system-ui,sans-serif"><h1>Dqua Donate belum dapat dimuat</h1><p>Muat ulang halaman. Jika masalah berlanjut, periksa build dan konfigurasi deployment.</p></section>';
  }
});
