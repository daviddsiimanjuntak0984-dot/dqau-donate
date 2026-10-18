import process from 'node:process';
import { Buffer } from 'node:buffer';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function isPresent(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  return !/^(YOUR_.*_HERE|REPLACE_ME|CHANGEME)$/i.test(value.trim());
}

function isValidSupabaseUrl(value: string | undefined): boolean {
  if (!isPresent(value)) return false;
  try {
    const url = new URL(value!.trim());
    const localDevelopment =
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
    return (url.protocol === 'https:' || localDevelopment) &&
      Boolean(url.hostname) && !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}

function isPublicSupabaseKey(value: string | undefined): boolean {
  if (!isPresent(value)) return false;
  const key = value!.trim();
  if (key.startsWith('sb_publishable_')) return true;

  const parts = key.split('.');
  if (parts.length !== 3) return false;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as { role?: unknown };
    return payload.role === 'anon';
  } catch {
    return false;
  }
}

export default defineConfig(({ mode }) => {
  // Vite also reads .env, .env.local, and mode-specific dotenv files.
  // Never print values here: diagnostics reveal only which names are absent.
  const loadedEnv = loadEnv(mode, process.cwd(), 'VITE_');
  const url = process.env.VITE_SUPABASE_URL ?? loadedEnv.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY ?? loadedEnv.VITE_SUPABASE_ANON_KEY;
  const missing: string[] = [];

  if (!isValidSupabaseUrl(url)) missing.push('VITE_SUPABASE_URL');
  if (!isPublicSupabaseKey(key)) missing.push('VITE_SUPABASE_ANON_KEY');

  const target = process.env.CF_PAGES === '1'
    ? 'Cloudflare Pages branch=' + (process.env.CF_PAGES_BRANCH || 'unknown')
    : 'Vite mode=' + mode;

  if (missing.length) {
    console.warn(
      '[Dqua build config] ' + target +
      ': missing or invalid public configuration variable names: ' + missing.join(', ') +
      '. Values are never logged. Vite embeds VITE_* values during build; the Pages runtime endpoint is used as a fallback.'
    );
  } else {
    console.info(
      '[Dqua build config] ' + target +
      ': required Supabase public configuration is present. Values are not logged.'
    );
  }

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
    },
  };
});
