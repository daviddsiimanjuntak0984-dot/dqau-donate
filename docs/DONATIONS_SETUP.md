# Dqua Donate payment and overlay setup

This branch adds an additive payment foundation using Midtrans Snap and a private Supabase Realtime Broadcast channel. The migration creates a new donation_transactions table so it does not overwrite the legacy public.donations table found in staging.

## Supabase

1. Apply supabase/migrations/20261017000000_dqua_donate_payment_overlay.sql to the staging project first.
2. Deploy the three Edge Functions from this repository.
3. Set the secret MIDTRANS_SERVER_KEY in Supabase Edge Function secrets.
4. Set MIDTRANS_IS_PRODUCTION=false while using Midtrans Sandbox. Change it to true only after merchant approval and successful production verification.

Supabase normally provides SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to Edge Functions. Never copy a service-role key into frontend variables or Git.

The public donation function and provider webhook do not require a Supabase user JWT. The webhook verifies Midtrans's SHA-512 signature and calls Midtrans's status API before updating a transaction. It never trusts a browser redirect as proof of payment.

## Deployment

~~~sh
supabase functions deploy create-donation --project-ref wztmgafrtxecvxzibzaq --no-verify-jwt
supabase functions deploy payment-webhook --project-ref wztmgafrtxecvxzibzaq --no-verify-jwt
supabase functions deploy create-overlay-token --project-ref wztmgafrtxecvxzibzaq
supabase secrets set MIDTRANS_SERVER_KEY=YOUR_SANDBOX_SERVER_KEY MIDTRANS_IS_PRODUCTION=false --project-ref wztmgafrtxecvxzibzaq
~~~

Use your real secret directly in a terminal session; never put it in this repository, a browser variable, or chat. These commands target staging (wztmgafrtxecvxzibzaq), not production (aaqfamoedywfjidwupou).

## Before production

- Add rate limiting and abuse protection for the public create-donation endpoint.
- Configure and verify the Midtrans merchant notification URL in Sandbox and run sandbox transactions.
- Test webhook retries, duplicate notifications, late notifications, refunds, RLS and Realtime authorization.
- Verify Cloudflare Pages uses only VITE_SUPABASE_URL and the publishable/anon key.
- Keep production secrets separate and deploy only after staging passes.
- A hosted donation feature is not production-ready until the provider account, notifications, refunds and end-to-end flow have been tested.
