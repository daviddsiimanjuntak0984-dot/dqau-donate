-- Dqua Donate: platform commission accounting (additive, non-destructive).
-- Commission is 5% of the gross donation amount (amount_idr).
-- net_to_creator_idr = amount_idr - platform_commission_idr.
-- Provider (Midtrans) fees are charged separately by the provider and are NOT
-- deducted here; they must never be double-counted with the platform commission.

ALTER TABLE public.donation_transactions
  ADD COLUMN IF NOT EXISTS platform_commission_idr integer NOT NULL DEFAULT 0
    CHECK (platform_commission_idr >= 0 AND platform_commission_idr <= amount_idr),
  ADD COLUMN IF NOT EXISTS net_to_creator_idr integer
    CHECK (net_to_creator_idr IS NULL OR (net_to_creator_idr >= 0 AND net_to_creator_idr <= amount_idr));

COMMENT ON COLUMN public.donation_transactions.platform_commission_idr IS
  'Platform fee: 5% of amount_idr, rounded down to whole rupiah.';
COMMENT ON COLUMN public.donation_transactions.net_to_creator_idr IS
  'Creator share: amount_idr minus platform commission. Provider fees are separate and not deducted here.';

-- Backfill existing paid rows using the documented formula (floor of 5%).
UPDATE public.donation_transactions
SET platform_commission_idr = floor(amount_idr * 0.05)::integer,
    net_to_creator_idr = amount_idr - floor(amount_idr * 0.05)::integer
WHERE status IN ('paid', 'partially_refunded', 'refunded')
  AND platform_commission_idr = 0;

-- Keep commission fields consistent whenever a transaction becomes paid.
CREATE OR REPLACE FUNCTION private.apply_dqua_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    NEW.platform_commission_idr := floor(NEW.amount_idr * 0.05)::integer;
    NEW.net_to_creator_idr := NEW.amount_idr - NEW.platform_commission_idr;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.apply_dqua_commission() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS dqua_apply_commission ON public.donation_transactions;
CREATE TRIGGER dqua_apply_commission
  BEFORE UPDATE ON public.donation_transactions
  FOR EACH ROW EXECUTE FUNCTION private.apply_dqua_commission();
