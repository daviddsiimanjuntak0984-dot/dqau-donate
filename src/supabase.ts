import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Public browser configuration for the Dqua Donate Supabase project.
// Hosting environment variables override these defaults. The anon key is intended
// for browser use; never put a service_role or secret key in frontend code.
const supabaseUrl = configuredUrl || 'https://aaqfamoedywfjidwupou.supabase.co';
const supabaseAnonKey = configuredAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhcWZhbW9lZHl3ZmppZHd1cG91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NTU4MzMsImV4cCI6MjEwNzMzMTgzM30.HqrNELJg33cNcOui5VAmt-lF5stXcZhxRd0We_YUmLk';

if ((!configuredUrl || !configuredAnonKey) && import.meta.env.DEV) {
  console.info('Using the default public Dqua Donate Supabase config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to override it.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export type AppSupabaseClient = SupabaseClient;
