import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const hasSupabaseConfig = Boolean(configuredUrl && configuredAnonKey);

if (!hasSupabaseConfig && import.meta.env.DEV) {
  console.warn('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env.local.');
}

// Use non-secret placeholders so the UI can still render when env vars are absent.
// Requests will fail until real project values are configured. Never put service_role keys in a browser app.
export const supabase = createClient(
  configuredUrl || 'https://placeholder.supabase.co',
  configuredAnonKey || 'missing-anon-key'
);

export const isSupabaseConfigured = hasSupabaseConfig;
export type AppSupabaseClient = SupabaseClient;
