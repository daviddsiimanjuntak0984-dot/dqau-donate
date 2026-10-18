import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}
function makeToken(): string {
  const random = new Uint8Array(32);
  crypto.getRandomValues(random);
  return Array.from(random, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = req.headers.get("Authorization");
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) {
    return json({ error: "Overlay service is not configured or the session is missing." }, 503);
  }

  try {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Authentication required." }, 401);

    const body = await req.json().catch(() => ({})) as { rotate?: boolean };
    const rotate = body.rotate === true;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (!rotate) {
      const { data: existing, error: lookupError } = await admin
        .from("overlay_credentials").select("overlay_token, is_active")
        .eq("creator_id", userData.user.id).maybeSingle();
      if (lookupError) throw lookupError;
      if (existing?.is_active && typeof existing.overlay_token === "string") {
        return json({ overlay_token: existing.overlay_token, is_active: true });
      }
    }

    const overlayToken = makeToken();
    const { error: upsertError } = await admin.from("overlay_credentials").upsert({
      creator_id: userData.user.id,
      overlay_token: overlayToken,
      is_active: true,
      last_rotated_at: new Date().toISOString(),
    }, { onConflict: "creator_id" });
    if (upsertError) throw upsertError;
    return json({ overlay_token: overlayToken, is_active: true });
  } catch (error) {
    console.error("[create-overlay-token] Token operation failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Tidak dapat menyiapkan overlay saat ini." }, 500);
  }
});
