/*
# Donation transactions, payment events, goals, overlay credentials

1. Plain-English explanation
   Adds the payment foundation: donation transaction records, an idempotent
   webhook event log, per-creator donation goals, and overlay credentials.
   Payment processing itself stays disabled until the owner explicitly enables
   it server-side (DQUA_DONATIONS_ENABLED=true). Mirrors
   supabase/migrations/20261017141526 from the repository.

   NOTE: the realtime broadcast pieces (realtime.messages policy,
   private.broadcast_dqua_paid_donation trigger, is_valid_dqua_overlay_topic)
   from the repository migration are intentionally omitted here because the
   realtime extension is not available in this Supabase project. The OBS
   overlay realtime alert feature is therefore blocked at the database level;
   everything else works identically.

2. New objects
   - Tables: donation_transactions, payment_events, creator_goals,
     overlay_credentials (all additive, IF NOT EXISTS).

3. Security
   - RLS enabled on all four tables.
   - donation_transactions: creators can SELECT their own only; no INSERT/UPDATE
     grants for browsers (status changes come from the server-side webhook).
   - payment_events: no client access at all.
   - creator_goals / overlay_credentials: owner-scoped CRUD; goals readable by
     anon when active; overlay tokens never exposed to other users.
*/
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.donation_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  supporter_name text NOT NULL DEFAULT 'Anonim' CHECK (char_length(supporter_name) BETWEEN 1 AND 40),
  supporter_email text,
  message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 200),
  amount_idr integer NOT NULL CHECK (amount_idr >= 1000 AND amount_idr <= 10000000),
  currency text NOT NULL DEFAULT 'IDR' CHECK (currency = 'IDR'),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'cancelled', 'partially_refunded', 'refunded')),
  provider text NOT NULL DEFAULT 'midtrans' CHECK (provider = 'midtrans'),
  provider_order_id text NOT NULL UNIQUE,
  provider_transaction_id text,
  payment_type text,
  checkout_url text,
  idempotency_key uuid NOT NULL UNIQUE,
  refunded_amount_idr integer NOT NULL DEFAULT 0
    CHECK (refunded_amount_idr >= 0 AND refunded_amount_idr <= amount_idr),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_donation_transactions_creator_status_created
  ON public.donation_transactions (creator_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donation_transactions_provider_transaction
  ON public.donation_transactions (provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'midtrans' CHECK (provider = 'midtrans'),
  provider_event_key text NOT NULL,
  provider_order_id text NOT NULL,
  event_status text NOT NULL,
  payload_sha256 text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_event_key)
);
CREATE INDEX IF NOT EXISTS idx_payment_events_order
  ON public.payment_events (provider_order_id, received_at DESC);

CREATE TABLE IF NOT EXISTS public.creator_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 300),
  target_amount_idr integer NOT NULL CHECK (target_amount_idr > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creator_goals_creator_active
  ON public.creator_goals (creator_id, is_active);

CREATE TABLE IF NOT EXISTS public.overlay_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  overlay_token text NOT NULL UNIQUE CHECK (overlay_token ~ '^[a-f0-9]{64}$'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_rotated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.donation_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overlay_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators can view their donation transactions" ON public.donation_transactions;
CREATE POLICY "Creators can view their donation transactions"
  ON public.donation_transactions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = creator_id);

DROP POLICY IF EXISTS "Public can view active creator goals" ON public.creator_goals;
CREATE POLICY "Public can view active creator goals"
  ON public.creator_goals FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Creators can view all their goals" ON public.creator_goals;
CREATE POLICY "Creators can view all their goals"
  ON public.creator_goals FOR SELECT TO authenticated USING ((SELECT auth.uid()) = creator_id);

DROP POLICY IF EXISTS "Creators can create their own goals" ON public.creator_goals;
CREATE POLICY "Creators can create their own goals"
  ON public.creator_goals FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = creator_id);

DROP POLICY IF EXISTS "Creators can update their own goals" ON public.creator_goals;
CREATE POLICY "Creators can update their own goals"
  ON public.creator_goals FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = creator_id) WITH CHECK ((SELECT auth.uid()) = creator_id);

DROP POLICY IF EXISTS "Creators can delete their own goals" ON public.creator_goals;
CREATE POLICY "Creators can delete their own goals"
  ON public.creator_goals FOR DELETE TO authenticated USING ((SELECT auth.uid()) = creator_id);

DROP POLICY IF EXISTS "Creators can view their overlay credential" ON public.overlay_credentials;
CREATE POLICY "Creators can view their overlay credential"
  ON public.overlay_credentials FOR SELECT TO authenticated USING ((SELECT auth.uid()) = creator_id);

DROP POLICY IF EXISTS "Creators can create their overlay credential" ON public.overlay_credentials;
CREATE POLICY "Creators can create their overlay credential"
  ON public.overlay_credentials FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = creator_id);

DROP POLICY IF EXISTS "Creators can update their overlay credential" ON public.overlay_credentials;
CREATE POLICY "Creators can update their overlay credential"
  ON public.overlay_credentials FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = creator_id) WITH CHECK ((SELECT auth.uid()) = creator_id);

DROP POLICY IF EXISTS "Creators can delete their overlay credential" ON public.overlay_credentials;
CREATE POLICY "Creators can delete their overlay credential"
  ON public.overlay_credentials FOR DELETE TO authenticated USING ((SELECT auth.uid()) = creator_id);

REVOKE ALL ON public.donation_transactions FROM anon, authenticated;
GRANT SELECT ON public.donation_transactions TO authenticated;
REVOKE ALL ON public.payment_events FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_goals TO authenticated;
GRANT SELECT ON public.creator_goals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.overlay_credentials TO authenticated;
REVOKE ALL ON public.overlay_credentials FROM anon;
