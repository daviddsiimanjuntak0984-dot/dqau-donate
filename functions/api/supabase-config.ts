interface PagesEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

interface PagesContext {
  env: PagesEnv;
}

const RESPONSE_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store, max-age=0",
  "pragma": "no-cache",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
};

function isUsableSupabaseUrl(value: string | undefined): value is string {
  if (!value) return false;

  try {
    const url = new URL(value.trim());
    const isLocalDevelopment =
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");
    const isSecure = url.protocol === "https:";

    return (isSecure || isLocalDevelopment) &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash;
  } catch {
    return false;
  }
}

function isPublicSupabaseClientKey(value: string | undefined): value is string {
  if (!value || !value.trim()) return false;
  const key = value.trim();

  // New publishable keys are designed for use by browser clients.
  if (key.startsWith("sb_publishable_")) return true;

  // Legacy anon keys are JWTs whose role claim is "anon". Reject service-role
  // or secret keys instead of accidentally exposing a privileged credential.
  const parts = key.split(".");
  if (parts.length !== 3) return false;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { role?: unknown };
    return payload.role === "anon";
  } catch {
    return false;
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: RESPONSE_HEADERS,
  });
}

/**
 * Runtime fallback for static Vite builds. VITE_* variables are normally
 * embedded by Vite at build time, while encrypted Pages secrets are available
 * to Pages Functions through context.env. This endpoint exposes only the
 * Supabase public client credentials intended for browser use; never bind a
 * service_role or sb_secret key to these names.
 *
 * Diagnostics return variable names only and never echo configuration values.
 */
export async function onRequestGet({ env }: PagesContext): Promise<Response> {
  const rawUrl = env.VITE_SUPABASE_URL?.trim();
  const rawKey = env.VITE_SUPABASE_ANON_KEY?.trim();
  const missing: string[] = [];

  if (!isUsableSupabaseUrl(rawUrl)) missing.push("VITE_SUPABASE_URL");
  if (!isPublicSupabaseClientKey(rawKey)) missing.push("VITE_SUPABASE_ANON_KEY");

  if (missing.length) {
    return jsonResponse({
      configured: false,
      missing,
      message: "Supabase runtime configuration is incomplete or invalid.",
    }, 503);
  }

  // Both values are public-client credentials. No values are logged, and the
  // endpoint is deliberately non-cacheable so production/preview stay separate.
  return jsonResponse({
    configured: true,
    url: new URL(rawUrl).toString().replace(/\/$/, ""),
    anonKey: rawKey,
  });
}
