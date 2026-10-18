/*
# Ensure donation safety flags exist for Edge Functions

1. Plain-English explanation
   Creates the donation safety flags as Edge Function secrets with values that
   keep payment processing OFF. Values are set through the MCP secret-writing
   path; this migration is a no-op placeholder because secret VALUES cannot be
   created with SQL, and we must never print secret values in logs.

2. Security
   - No table, column, policy, or data changes.
   - If this migration runs when the secrets already exist, it changes nothing.
*/
DO $$
BEGIN
  -- No-op: secrets are managed outside SQL. Kept as documented placeholder.
  RETURN;
END $$;
