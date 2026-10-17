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
function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength);
}
function isUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function existingResponse(existing: Record<string, unknown>, creatorId: string, amount: number): Response {
  if (existing.creator_id !== creatorId || Number(existing.amount_idr) !== amount) {
    return json({ error: "Kunci idempotensi sudah dipakai untuk permintaan berbeda." }, 409);
  }
  if (typeof existing.checkout_url === "string" && existing.checkout_url.length > 0) {
    return json({
      success: true,
      donation_id: existing.id,
      payment_reference: existing.provider_order_id,
      checkout_url: existing.checkout_url,
      status: existing.status || "pending",
      reused: true,
    });
  }
  return json({ error: "Transaksi sebelumnya masih diproses. Coba lagi dengan kunci yang sama sebentar lagi." }, 409);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Metode tidak diizinkan." }, 405);

  const midtransServerKey = Deno.env.get("MIDTRANS_SERVER_KEY");
  if (!midtransServerKey) {
    return json({
      error: "Pembayaran belum diaktifkan. Pengelola harus mengonfigurasi kredensial Midtrans terlebih dahulu.",
      code: "PAYMENT_PROVIDER_NOT_CONFIGURED",
    }, 503);
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[create-donation] Required Supabase server environment is missing.");
    return json({ error: "Layanan pembayaran belum siap." }, 503);
  }

  try {
    const body = await req.json();
    if (!body || typeof body !== "object") return json({ error: "Data donasi tidak valid." }, 400);
    const creatorId = body.creator_id;
    const amount = body.amount_idr;
    const idempotencyKey = body.idempotency_key;
    if (!isUuid(creatorId) || !Number.isInteger(amount) || amount < 1000 || amount > 10000000 ||
        !isUuid(idempotencyKey)) {
      return json({ error: "Kreator, nominal, atau kunci transaksi tidak valid." }, 400);
    }

    const supporterName = cleanText(body.supporter_name, 40) || "Anonim";
    const supporterEmail = cleanText(body.supporter_email, 254);
    const message = cleanText(body.message, 200);
    if (supporterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supporterEmail)) {
      return json({ error: "Format email pendukung tidak valid." }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: creator, error: creatorError } = await admin
      .from("profiles").select("id, username, display_name").eq("id", creatorId).maybeSingle();
    if (creatorError) throw creatorError;
    if (!creator) return json({ error: "Profil kreator tidak ditemukan." }, 404);

    const { data: existing, error: existingError } = await admin
      .from("donation_transactions")
      .select("id, creator_id, amount_idr, checkout_url, provider_order_id, status")
      .eq("idempotency_key", idempotencyKey).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return existingResponse(existing as Record<string, unknown>, creatorId, amount);

    const orderId = "DQUA-" + crypto.randomUUID();
    const { data: donation, error: insertError } = await admin
      .from("donation_transactions")
      .insert({
        creator_id: creatorId,
        supporter_name: supporterName,
        supporter_email: supporterEmail || null,
        message,
        amount_idr: amount,
        currency: "IDR",
        status: "pending",
        provider: "midtrans",
        provider_order_id: orderId,
        idempotency_key: idempotencyKey,
      })
      .select("id, creator_id, amount_idr, provider_order_id, status").single();

    if (insertError) {
      if (insertError.code === "23505") {
        const { data: raced } = await admin.from("donation_transactions")
          .select("id, creator_id, amount_idr, checkout_url, provider_order_id, status")
          .eq("idempotency_key", idempotencyKey).maybeSingle();
        if (raced) return existingResponse(raced as Record<string, unknown>, creatorId, amount);
      }
      throw insertError;
    }

    const isProduction = Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true";
    const snapBase = isProduction ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
    const publicBase = supabaseUrl.replace(/\/+$/, "");
    const creatorName = cleanText(creator.display_name, 40) || cleanText(creator.username, 24) || "Kreator Dqua";
    const snapPayload: Record<string, unknown> = {
      transaction_details: { order_id: orderId, gross_amount: amount },
      item_details: [{
        id: "dqua-donation",
        price: amount,
        quantity: 1,
        name: ("Dukungan untuk " + creatorName).slice(0, 50),
      }],
    };
    const customerDetails: Record<string, string> = { first_name: supporterName };
    if (supporterEmail) customerDetails.email = supporterEmail;
    snapPayload.customer_details = customerDetails;

    const snapResponse = await fetch(snapBase + "/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(midtransServerKey + ":"),
        "X-Override-Notification": publicBase + "/functions/v1/payment-webhook",
      },
      body: JSON.stringify(snapPayload),
    });
    const snapResult = await snapResponse.json().catch(() => ({})) as Record<string, unknown>;
    if (!snapResponse.ok || typeof snapResult.redirect_url !== "string" ||
        !snapResult.redirect_url.startsWith(snapBase + "/")) {
      console.error("[create-donation] Midtrans Snap request failed with status", snapResponse.status);
      await admin.from("donation_transactions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", donation.id).eq("status", "pending");
      return json({ error: "Penyedia pembayaran belum dapat membuat transaksi. Coba lagi nanti." }, 502);
    }

    const { error: updateError } = await admin.from("donation_transactions")
      .update({ checkout_url: snapResult.redirect_url, updated_at: new Date().toISOString() })
      .eq("id", donation.id);
    if (updateError) throw updateError;

    return json({
      success: true,
      donation_id: donation.id,
      payment_reference: orderId,
      checkout_url: snapResult.redirect_url,
      status: "pending",
    });
  } catch (error) {
    console.error("[create-donation] Request failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Tidak dapat membuat transaksi saat ini. Coba lagi nanti." }, 500);
  }
});
