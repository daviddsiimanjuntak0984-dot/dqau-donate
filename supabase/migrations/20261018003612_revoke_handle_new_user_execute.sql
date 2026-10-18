/*
# Lock down handle_new_user trigger function

1. Plain-English explanation
   The signup trigger helper `handle_new_user()` is only meant to run
   automatically when a new account is created. The security linter found it
   was also directly callable by any visitor or signed-in user through the
   public API. This migration revokes that direct access. The trigger on
   auth.users keeps working exactly as before because triggers run with the
   function owner's rights, not the caller's.

2. Security changes
   - REVOKE EXECUTE on public.handle_new_user from anon, authenticated, PUBLIC.
   - No table, column, or data changes.
*/
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
