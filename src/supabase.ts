import { createClient } from '@supabase/supabase-js';

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const hasSupabaseConfig = Boolean(configuredUrl && configuredAnonKey);

if (!hasSupabaseConfig) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your local .env or hosting environment.'
  );
}

// Use non-secret placeholders so the UI can still render when env vars are absent.
// Requests will fail until real project values are configured. Never put service_role keys in a browser app.
export const supabase = createClient(
  configuredUrl || 'https://placeholder.supabase.co',
  configuredAnonKey || 'missing-anon-key'
);

export const isSupabaseConfigured = hasSupabaseConfig;
