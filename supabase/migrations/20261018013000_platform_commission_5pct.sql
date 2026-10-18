-- Add platform commission accounting to the existing donation transaction table.
-- Additive migration: does not delete or alter legacy public.donations rows.
-- No payout/withdrawal is enabled by this schema change.

ALTER TABLE public.donation_transactions
  ADD COLUMN IF NOT EXISTS platform_commission_rate_bps integer NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS platform_commission_amount_idr integer,
  ADD COLUMN IF NOT EXISTS creator_net_before_provider_fee_idr integer,
  ADD COLUMN IF NOT EXISTS provider_fee_amount_idr integer,
  ADD COLUMN IF NOT EXISTS creator_net_amount_idr integer,
  ADD COLUMN IF NOT EXISTS financials_calculated_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'donation_transactions_commission_rate_bps_check'
      AND conrelid = 'public.donation_transactions'::regclass
  ) THEN
    ALTER TABLE public.donation_transactions
      ADD CONSTRAINT donation_transactions_commission_rate_bps_check
      CHECK (platform_commission_rate_bps BETWEEN 0 AND 10000) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'donation_transactions_commission_amount_check'
      AND conrelid = 'public.donation_transactions'::regclass
  ) THEN
    ALTER TABLE public.donation_transactions
      ADD CONSTRAINT donation_transactions_commission_amount_check
      CHECK (
        platform_commission_amount_idr IS NULL OR
        platform_commission_amount_idr BETWEEN 0 AND amount_idr
      ) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'donation_transactions_creator_net_before_provider_fee_check'
      AND conrelid = 'public.donation_transactions'::regclass
  ) THEN
    ALTER TABLE public.donation_transactions
      ADD CONSTRAINT donation_transactions_creator_net_before_provider_fee_check
      CHECK (
        creator_net_before_provider_fee_idr IS NULL OR
        (
          platform_commission_amount_idr IS NOT NULL AND
          creator_net_before_provider_fee_idr =
            amount_idr - platform_commission_amount_idr
        )
      ) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'donation_transactions_provider_fee_check'
      AND conrelid = 'public.donation_transactions'::regclass
  ) THEN
    ALTER TABLE public.donation_transactions
      ADD CONSTRAINT donation_transactions_provider_fee_check
      CHECK (
        provider_fee_amount_idr IS NULL OR
        (
          provider_fee_amount_idr >= 0 AND
          creator_net_before_provider_fee_idr IS NOT NULL AND
          provider_fee_amount_idr <= creator_net_before_provider_fee_idr
        )
      ) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'donation_transactions_creator_net_amount_check'
      AND conrelid = 'public.donation_transactions'::regclass
  ) THEN
    ALTER TABLE public.donation_transactions
      ADD CONSTRAINT donation_transactions_creator_net_amount_check
      CHECK (
        creator_net_amount_idr IS NULL OR
        (
          provider_fee_amount_idr IS NOT NULL AND
          creator_net_amount_idr =
            creator_net_before_provider_fee_idr - provider_fee_amount_idr
        )
      ) NOT VALID;
  END IF;
END $$;

ALTER TABLE public.donation_transactions
  VALIDATE CONSTRAINT donation_transactions_commission_rate_bps_check;
ALTER TABLE public.donation_transactions
  VALIDATE CONSTRAINT donation_transactions_commission_amount_check;
ALTER TABLE public.donation_transactions
  VALIDATE CONSTRAINT donation_transactions_creator_net_before_provider_fee_check;
ALTER TABLE public.donation_transactions
  VALIDATE CONSTRAINT donation_transactions_provider_fee_check;
ALTER TABLE public.donation_transactions
  VALIDATE CONSTRAINT donation_transactions_creator_net_amount_check;

CREATE INDEX IF NOT EXISTS idx_donation_transactions_commission_created
  ON public.donation_transactions (created_at DESC, platform_commission_rate_bps);

CREATE OR REPLACE FUNCTION private.calculate_donation_financials()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF NEW.platform_commission_rate_bps IS NULL THEN
    NEW.platform_commission_rate_bps := 500;
  END IF;

  IF NEW.platform_commission_rate_bps < 0 OR NEW.platform_commission_rate_bps > 10000 THEN
    RAISE EXCEPTION 'Invalid platform commission rate';
  END IF;

  -- Calculate an IDR commission at the configured basis-point rate (500 bps = 5%).
  NEW.platform_commission_amount_idr :=
    round(NEW.amount_idr::numeric * NEW.platform_commission_rate_bps / 10000)::integer;
  NEW.creator_net_before_provider_fee_idr :=
    NEW.amount_idr - NEW.platform_commission_amount_idr;

  -- Actual provider fees are unknown until the provider confirms them. Never
  -- report a final net amount until the fee is verified and recorded.
  IF NEW.provider_fee_amount_idr IS NOT NULL THEN
    IF NEW.provider_fee_amount_idr < 0 OR
       NEW.provider_fee_amount_idr > NEW.creator_net_before_provider_fee_idr THEN
      RAISE EXCEPTION 'Invalid provider fee amount';
    END IF;
    NEW.creator_net_amount_idr :=
      NEW.creator_net_before_provider_fee_idr - NEW.provider_fee_amount_idr;
  ELSE
    NEW.creator_net_amount_idr := NULL;
  END IF;

  NEW.financials_calculated_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.calculate_donation_financials() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_calculate_donation_financials ON public.donation_transactions;
CREATE TRIGGER trg_calculate_donation_financials
BEFORE INSERT OR UPDATE OF amount_idr, platform_commission_rate_bps, provider_fee_amount_idr
ON public.donation_transactions
FOR EACH ROW
EXECUTE FUNCTION private.calculate_donation_financials();

COMMENT ON COLUMN public.donation_transactions.platform_commission_rate_bps IS
  'Platform commission in basis points; 500 basis points equals 5 percent.';
COMMENT ON COLUMN public.donation_transactions.platform_commission_amount_idr IS
  'Server-calculated platform commission in IDR.';
COMMENT ON COLUMN public.donation_transactions.provider_fee_amount_idr IS
  'Actual provider fee in IDR, null until verified from provider settlement/report.';
COMMENT ON COLUMN public.donation_transactions.creator_net_before_provider_fee_idr IS
  'Gross amount minus platform commission, before provider fee.';
COMMENT ON COLUMN public.donation_transactions.creator_net_amount_idr IS
  'Final net after platform commission and verified provider fee; null until fee is known.';
