import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Warn in development; do not expose secrets in code.
  // The app will still initialize the client but operations will fail until env vars are set.
  // Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment or .env.
  // Example .env.example is provided in the repo.
  // NOTE: Never commit the Supabase service_role key or other secrets into the repo.
  // This check avoids falling back to a hardcoded key.
  // eslint-disable-next-line no-console
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Supabase client may not work until configured.');
}

export const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '');
