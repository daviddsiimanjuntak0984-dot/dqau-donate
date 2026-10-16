import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const callerClient = (authorization: string) =>
  createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

const isUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

// Recursively list only this user's folder; never enumerate or delete another user's media.
async function listUserFiles(prefix: string): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;
  const pageSize = 100;

  while (true) {
    const { data, error } = await adminClient.storage
      .from("media")
      .list(prefix, { limit: pageSize, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error("Gagal membaca Storage: " + error.message);
    if (!data?.length) break;

    for (const entry of data) {
      const path = prefix ? prefix + "/" + entry.name : entry.name;
      // Supabase Storage represents folders as entries without an object id/metadata.
      if (entry.id == null && entry.metadata == null) {
        paths.push(...await listUserFiles(path));
      } else {
        paths.push(path);
      }
    }

    if (data.length < pageSize) break;
    offset += data.length;
  }

  return paths;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Gunakan POST." }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "Perlu sesi admin yang valid." }, 401);
  }

  const caller = callerClient(authorization);
  const { data: authData, error: authError } = await caller.auth.getUser();
  if (authError || !authData.user) return json({ error: "Sesi tidak valid." }, 401);

  // app_metadata is server-controlled; never authorize using editable user_metadata.
  if (authData.user.app_metadata?.role !== "admin") {
    return json({ error: "Hanya admin yang diizinkan menghapus akun." }, 403);
  }

  let body: { user_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body harus JSON dengan user_id." }, 400);
  }
  const targetId = body?.user_id;
  if (!isUuid(targetId)) return json({ error: "user_id tidak valid." }, 400);
  if (targetId === authData.user.id) {
    return json({ error: "Admin tidak boleh menghapus akun yang sedang dipakai." }, 400);
  }

  try {
    const paths = await listUserFiles(targetId);
    // Delete the public objects first. If cleanup fails, preserve the Auth account.
    for (let i = 0; i < paths.length; i += 100) {
      const { error } = await adminClient.storage.from("media").remove(paths.slice(i, i + 100));
      if (error) throw new Error("Gagal menghapus file Storage; akun belum dihapus: " + error.message);
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetId);
    if (deleteError) {
      throw new Error("File media sudah dibersihkan, tetapi akun gagal dihapus: " + deleteError.message);
    }

    return json({ success: true, deleted_user_id: targetId, deleted_media_files: paths.length });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Penghapusan akun gagal." }, 500);
  }
});
