import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Elemen root tidak ditemukan. Periksa index.html.');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register the service worker only on supported browsers; localhost and HTTPS are secure contexts.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        if (import.meta.env.DEV) console.info('Dqau Donate service worker registered:', registration.scope);
      })
      .catch((error: unknown) => {
        console.warn('Dqau Donate service worker registration failed:', error);
      });
  }, { once: true });
}
