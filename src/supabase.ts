import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const missingEnvVars: string[] = [];
if (!SUPABASE_URL) missingEnvVars.push('VITE_SUPABASE_URL');
if (!SUPABASE_ANON_KEY) missingEnvVars.push('VITE_SUPABASE_ANON_KEY');

if (!isSupabaseConfigured) {
  // Keep the public UI renderable when deployment variables are missing.
  // Auth/database requests will not work until the real values are configured.
  // Never put a service_role key or other secret in client-side code.
  console.warn(
    'Dqua Donate: Supabase environment variables are missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the deployment settings.'
  );
}

// Supabase's client constructor requires a valid URL and a non-empty key.
// These local placeholders prevent a missing deployment variable from crashing
// the entire React app at import time. They do not enable Supabase functionality.
export const supabase = createClient(
  SUPABASE_URL || 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY || 'missing-anon-key'
);
