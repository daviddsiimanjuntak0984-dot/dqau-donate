# Dqua Donate payment and overlay setup

## Current state: payment processing disabled

Payment creation and webhook reconciliation are **disabled by default**. The Edge Functions return `503 DONATION_PROCESSING_DISABLED` unless the server-side flag `DQUA_DONATIONS_ENABLED=true` is explicitly set. Do not set this flag or configure production payment credentials until the owner explicitly approves payment processing.

This code path is separate from the OBS visual demo at `/?overlay=1&preview=1&demo=1`, which is a local preview and never creates a transaction. No QRIS/e-wallet payments, production gateway checkout, payout, or withdrawal is enabled by default.

## Future activation (reference only; not approved)

When the owner explicitly authorizes payment testing, use only the staging project first. This migration adds `donation_transactions` without overwriting the legacy `public.donations` table.

Before any activation:
1. Obtain explicit owner approval for the intended sandbox scope.
2. Add `DQUA_DONATIONS_ENABLED=true` as a server-side Supabase Edge Function secret only for the approved staging environment.
3. Configure `MIDTRANS_SERVER_KEY` using the **Sandbox** credential. Keep `MIDTRANS_IS_PRODUCTION=false`.
4. Deploy and test the Edge Functions and webhook signature/status reconciliation end-to-end in staging.
5. Do not enable production mode, QRIS/e-wallet live checkout, payouts, or withdrawals without a separate explicit approval and security review.

Supabase normally provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. The service-role credential must remain server-side and must never be copied into frontend variables, logged, committed, or shared in chat.

## Function behavior

- `create-donation` denies checkout by default unless the explicit server-side flag is enabled. It validates creator, amount, input text, idempotency, and provider configuration before attempting to create a provider checkout.
- `payment-webhook` is also disabled by default. If deliberately activated in a future approved test, it verifies the provider signature and reconciles status through the provider's status API before changing a transaction.
- The browser must not treat a redirect or client-side message as proof of payment.
- `create-overlay-token` is separate from payment activation and provides creator-scoped private Realtime credentials.

Do not paste secrets into repository files or ChatGPT. Deployment commands are intentionally omitted here so this documentation cannot accidentally enable payment processing without the owner approving the exact scope.
