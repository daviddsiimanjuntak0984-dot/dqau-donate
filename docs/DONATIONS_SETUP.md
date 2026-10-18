# Dqua Donate payment and overlay setup

## Current state: payment processing disabled

Payment creation and webhook reconciliation are **disabled by default**. The Edge Functions return `503 DONATION_PROCESSING_DISABLED` unless the server-side flag `DQUA_DONATIONS_ENABLED=true` is explicitly set after owner approval. Do not enable this flag or configure production payment credentials until payment testing has been explicitly approved.

This is separate from the OBS visual demo at `/?overlay=1&preview=1&demo=1`, which never creates a transaction. No live QRIS/e-wallet checkout, payout, or withdrawal is enabled by default.

## Platform commission accounting

The planned platform commission is 5% of gross donation amount. The additive migration `20261018013000_platform_commission_5pct.sql` adds server-calculated financial breakdown fields to `donation_transactions`:
- `platform_commission_rate_bps`: 500 basis points = 5%.
- `platform_commission_amount_idr`: gross amount × rate, rounded to whole IDR.
- `creator_net_before_provider_fee_idr`: gross amount minus platform commission.
- `provider_fee_amount_idr`: actual provider fee, left unknown (`NULL`) until verified.
- `creator_net_amount_idr`: final amount after the platform commission and verified provider fee; remains `NULL` while provider fee is unknown.

The database trigger calculates the commission on transaction insert/update. It does not transfer money or grant payout capability. Do not describe the pre-provider-fee amount as final payout. Actual provider fees must be obtained from the provider's valid configuration/settlement data before final net or withdrawals can be calculated.

## Future activation (not approved for production)

When the owner explicitly authorizes payment testing, use only the intended staging backend first. Before activation:
1. Obtain explicit owner approval for the intended Sandbox scope.
2. Apply the migration to the correct staging database and verify the columns/trigger.
3. Set `DQUA_DONATIONS_ENABLED=true` as a server-side Edge Function secret **only** for the approved staging environment.
4. Configure a valid **Sandbox** `MIDTRANS_SERVER_KEY` using the provider's secret store. Keep `MIDTRANS_IS_PRODUCTION=false`.
5. Deploy and test checkout creation, webhook signatures, status reconciliation, idempotency, invalid payloads, and disabled-mode behavior end-to-end in staging.
6. Reconcile actual provider fees and test refunds using Sandbox only.
7. Do not enable Production mode, live QRIS/e-wallet, payouts, or withdrawals without separate explicit owner approval and a security review.

Supabase normally provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. The service-role credential must remain server-side and must never be copied into frontend variables, logged, committed, or shared in chat.

## Function behavior

- `create-donation` denies checkout unless the server-side feature flag is explicitly enabled. It validates creator, amount, input text, idempotency, and provider configuration before checkout.
- `payment-webhook` is also disabled by default. If deliberately enabled in an approved test, it verifies the provider signature and reconciles status via the provider before changing a transaction.
- The browser must not treat redirects or client-side messages as proof of payment.
- `create-overlay-token` is separate from payment activation and uses creator-scoped credentials for private Realtime.

Do not paste secrets into repository files or ChatGPT. Configure SMTP, payment credentials, and other secrets only in the environment that actually executes the feature.
