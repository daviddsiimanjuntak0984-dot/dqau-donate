import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const BUILD_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BUILD_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

type RuntimeConfig = {
  configured?: boolean;
  missing?: unknown;
  url?: unknown;
  anonKey?: unknown;
};

const PLACEHOLDER_URL = 'http://127.0.0.1:54321';
const PLACEHOLDER_KEY = 'supabase-client-not-configured';
const REQUIRED_CONFIG_NAMES = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;

function normalizeSupabaseUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    const localDevelopment =
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
    if (
      (url.protocol !== 'https:' && !localDevelopment) ||
      !url.hostname ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) return null;
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function isPublicSupabaseClientKey(value: string | undefined): value is string {
  if (!value?.trim()) return false;
  const key = value.trim();

  // Modern publishable keys are intended for browser clients.
  if (key.startsWith('sb_publishable_')) return true;

  // Legacy Supabase anon keys are JWTs with role=anon. Reject privileged
  // service_role JWTs and sb_secret_* keys rather than exposing them to clients.
  const parts = key.split('.');
  if (parts.length !== 3) return false;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded)) as { role?: unknown };
    return payload.role === 'anon';
  } catch {
    return false;
  }
}

function getMissingBuildVars(): string[] {
  const missing: string[] = [];
  if (!normalizeSupabaseUrl(BUILD_SUPABASE_URL)) missing.push('VITE_SUPABASE_URL');
  if (!isPublicSupabaseClientKey(BUILD_SUPABASE_KEY)) missing.push('VITE_SUPABASE_ANON_KEY');
  return missing;
}

function safeReportedNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string =>
    typeof item === 'string' &&
    REQUIRED_CONFIG_NAMES.includes(item as (typeof REQUIRED_CONFIG_NAMES)[number])
  );
}

const buildUrl = normalizeSupabaseUrl(BUILD_SUPABASE_URL);
const buildKey = isPublicSupabaseClientKey(BUILD_SUPABASE_KEY)
  ? (BUILD_SUPABASE_KEY as string).trim()
  : null;

export let isSupabaseConfigured = Boolean(buildUrl && buildKey);
export let missingEnvVars: string[] = getMissingBuildVars();
export let supabaseConfigSource: 'build' | 'runtime' | 'missing' =
  isSupabaseConfigured ? 'build' : 'missing';

// Always initialize a safe local placeholder client. This prevents a missing
// deployment variable from throwing during module import and blanking React.
// No auth/data operation should run until isSupabaseConfigured is true.
export let supabase: SupabaseClient = createClient(
  buildUrl || PLACEHOLDER_URL,
  buildKey || PLACEHOLDER_KEY
);

let initializationPromise: Promise<void> | null = null;

/**
 * Use Vite's build-time public config when present. If a Pages deployment has
 * only runtime Variables/Secrets configured, request the same-origin Pages
 * Function. The response must contain a public anon/publishable key; secret
 * service-role keys are rejected. Diagnostic logs include names only.
 */
export function initializeSupabase(): Promise<void> {
  if (isSupabaseConfigured) return Promise.resolve();
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4500);
    let reportedMissing: string[] = [];

    try {
      const response = await fetch('/api/supabase-config', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      let payload: RuntimeConfig | null = null;
      try {
        payload = await response.json() as RuntimeConfig;
      } catch {
        payload = null;
      }

      reportedMissing = safeReportedNames(payload?.missing);
      const runtimeUrl = typeof payload?.url === 'string'
        ? normalizeSupabaseUrl(payload.url)
        : null;
      const runtimeKey = typeof payload?.anonKey === 'string' &&
        isPublicSupabaseClientKey(payload.anonKey)
        ? payload.anonKey.trim()
        : null;

      if (response.ok && payload?.configured === true && runtimeUrl && runtimeKey) {
        supabase = createClient(runtimeUrl, runtimeKey);
        isSupabaseConfigured = true;
        missingEnvVars = [];
        supabaseConfigSource = 'runtime';
        console.info('[Dqua config] Supabase public client configured from Pages runtime. Credential values are not logged.');
        return;
      }

      missingEnvVars = reportedMissing.length
        ? reportedMissing
        : getMissingBuildVars();
      supabaseConfigSource = 'missing';
      console.warn(
        '[Dqua config] Supabase auth/data is disabled. Missing or invalid variable names: ' +
        (missingEnvVars.join(', ') || REQUIRED_CONFIG_NAMES.join(', ')) +
        '. Configuration values are not logged.'
      );
    } catch {
      // A missing Pages Function, a timeout, or an invalid response must not
      // crash the site. Keep the UI available and show honest diagnostics.
      missingEnvVars = getMissingBuildVars();
      supabaseConfigSource = 'missing';
      console.warn(
        '[Dqua config] Runtime configuration endpoint is unavailable; Supabase auth/data is disabled. ' +
        'Missing or invalid variable names: ' +
        (missingEnvVars.join(', ') || REQUIRED_CONFIG_NAMES.join(', ')) +
        '. Configuration values are not logged.'
      );
    } finally {
      window.clearTimeout(timeoutId);
    }
  })();

  return initializationPromise;
}
