import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
async function digestHex(algorithm: "SHA-256" | "SHA-512", value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest(algorithm, bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function constantTimeHexEqual(expected: string, received: unknown): boolean {
  if (typeof received !== "string" || !/^[a-f0-9]+$/i.test(received) || received.length !== expected.length) return false;
  let difference = 0;
  const normalized = received.toLowerCase();
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ normalized.charCodeAt(i);
  return difference === 0;
}
type MidtransStatus = {
  order_id?: string;
  gross_amount?: string;
  transaction_status?: string;
  status_code?: string;
  transaction_id?: string;
  payment_type?: string;
  fraud_status?: string;
  refund_amount?: string | number;
};
function mapStatus(value: string, fraudStatus?: string): "pending" | "paid" | "failed" | "expired" | "cancelled" | "partially_refunded" | "refunded" {
  if (value === "settlement") return "paid";
  if (value === "capture") return fraudStatus === "accept" ? "paid" : "pending";
  if (value === "pending") return "pending";
  if (value === "expire") return "expired";
  if (value === "cancel") return "cancelled";
  if (value === "deny" || value === "failure") return "failed";
  if (value === "refund") return "refunded";
  if (value === "partial_refund") return "partially_refunded";
  return "pending";
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serverKey || !supabaseUrl || !serviceRoleKey) {
    console.error("[payment-webhook] Payment or Supabase server environment is missing.");
    return json({ error: "Webhook is not configured." }, 503);
  }

  try {
    const rawBody = await req.text();
    if (rawBody.length > 65536) return json({ error: "Payload too large." }, 413);
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return json({ error: "Invalid JSON." }, 400);
    }

    const orderId = body.order_id;
    const statusCode = body.status_code;
    const grossAmount = body.gross_amount;
    if (typeof orderId !== "string" || typeof statusCode !== "string" ||
        typeof grossAmount !== "string" || typeof body.signature_key !== "string") {
      return json({ error: "Missing required notification fields." }, 400);
    }
    const expectedSignature = await digestHex("SHA-512", orderId + statusCode + grossAmount + serverKey);
    if (!constantTimeHexEqual(expectedSignature, body.signature_key)) {
      return json({ error: "Invalid notification signature." }, 401);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: donation, error: lookupError } = await admin
      .from("donation_transactions")
      .select("id, creator_id, amount_idr, status, provider_order_id")
      .eq("provider_order_id", orderId).eq("provider", "midtrans").maybeSingle();
    if (lookupError) throw lookupError;
    if (!donation) {
      console.warn("[payment-webhook] Signed notification did not match a Dqua order.");
      return json({ success: true, ignored: true });
    }
    if (!Number.isFinite(Number(grossAmount)) || Math.round(Number(grossAmount)) !== donation.amount_idr) {
      console.error("[payment-webhook] Notification amount did not match local order", orderId);
      return json({ error: "Notification amount mismatch." }, 400);
    }

    // Reconcile against the current provider status over TLS before writing state.
    const isProduction = Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true";
    const statusBase = isProduction ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com";
    const statusResponse = await fetch(statusBase + "/v2/" + encodeURIComponent(orderId) + "/status", {
      headers: {
        "Accept": "application/json",
        "Authorization": "Basic " + btoa(serverKey + ":"),
      },
    });
    if (!statusResponse.ok) {
      console.error("[payment-webhook] Midtrans status verification failed with status", statusResponse.status);
      return json({ error: "Could not verify payment status." }, 502);
    }
    const verified = await statusResponse.json() as MidtransStatus;
    if (verified.order_id !== orderId ||
        !Number.isFinite(Number(verified.gross_amount)) ||
        Math.round(Number(verified.gross_amount)) !== donation.amount_idr ||
        typeof verified.transaction_status !== "string") {
      console.error("[payment-webhook] Midtrans status response did not match local order", orderId);
      return json({ error: "Provider status mismatch." }, 409);
    }

    const newStatus = mapStatus(verified.transaction_status, verified.fraud_status);
    const now = new Date().toISOString();
    let refundedAmount = 0;
    if (newStatus === "partially_refunded") {
      const parsedRefund = Number(verified.refund_amount ?? body.refund_amount);
      if (Number.isFinite(parsedRefund) && parsedRefund > 0) {
        refundedAmount = Math.min(donation.amount_idr, Math.round(parsedRefund));
      } else {
        return json({ success: true, ignored: true, reason: "Partial refund requires reconciliation." });
      }
    } else if (newStatus === "refunded") {
      refundedAmount = donation.amount_idr;
    }

    const patch: Record<string, unknown> = {
      status: newStatus,
      provider_transaction_id: typeof verified.transaction_id === "string" ? verified.transaction_id : null,
      payment_type: typeof verified.payment_type === "string" ? verified.payment_type : null,
      updated_at: now,
    };
    if (newStatus === "paid") patch.paid_at = now;
    if (newStatus === "partially_refunded" || newStatus === "refunded") patch.refunded_amount_idr = refundedAmount;

    let updateQuery = admin.from("donation_transactions").update(patch).eq("id", donation.id);
    if (newStatus === "partially_refunded") {
      updateQuery = updateQuery.in("status", ["paid", "partially_refunded"]);
    } else if (newStatus === "refunded") {
      updateQuery = updateQuery.in("status", ["paid", "partially_refunded", "refunded"]);
    } else {
      updateQuery = updateQuery.not("status", "in", "(paid,partially_refunded,refunded)");
    }
    const { error: updateError } = await updateQuery;
    if (updateError) throw updateError;

    const payloadHash = await digestHex("SHA-256", rawBody);
    const { error: eventError } = await admin.from("payment_events").upsert({
      provider: "midtrans",
      provider_event_key: payloadHash,
      provider_order_id: orderId,
      event_status: verified.transaction_status,
      payload_sha256: payloadHash,
    }, { onConflict: "provider,provider_event_key", ignoreDuplicates: true });
    if (eventError) throw eventError;

    return json({ success: true });
  } catch (error) {
    console.error("[payment-webhook] Notification processing failed:", error instanceof Error ? error.message : "Unknown error");
    return json({ error: "Notification processing failed." }, 500);
  }
});
