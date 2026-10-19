# Email verification and password recovery with Supabase Auth + Resend

This project uses Supabase Auth for registration, email confirmation, password recovery, and session management. Resend is the SMTP delivery provider; it does not replace Supabase Auth and it does not provide SMS OTP.

## Required dashboard setup

Configure the same canonical Supabase/Bolt Database project used by the app. Do not copy the previous project ref from an old example.

1. Create or sign in to a Resend account: https://resend.com/
2. In Resend, create an API key for SMTP use. Do not paste it into the repository, frontend, GitHub issue, or ChatGPT.
3. Add and verify the sender domain in Resend, then complete the DNS records Resend requests (typically DKIM and SPF; configure DMARC as appropriate).
4. In the Supabase-compatible project's Authentication settings, configure custom SMTP:
   - Host: `smtp.resend.com`
   - Port: `465` (secure SMTP)
   - Username: `resend`
   - Password: the Resend API key, stored only in the provider's secret field
   - Sender email: an address on a domain verified by Resend
   - Sender name: `Dqua Donate`
5. Keep email confirmation enabled. Confirm the Site URL and allowlist redirect URLs for local development, the current Cloudflare Preview host, and `https://dqau-donate.pages.dev`.
6. Review the Auth templates for confirmation and password recovery. Links must return to the configured app URL and the app must handle recovery tokens.
7. Send one test email to an address you control. Confirm that the message arrives, the link works once, expired links show a helpful error, and resend/password recovery obeys rate limits.

If the UI is using Bolt Database's Authentication panel rather than the Supabase dashboard, configure the SMTP settings on that exact backend/project. Secrets in Bolt project UI, Cloudflare Pages, GitHub Actions, and Supabase Edge Functions are separate scopes unless that platform explicitly documents otherwise.

## Free plan and limits

Resend's current Free plan lists 3,000 emails per month and a daily cap of 100. Limits and eligibility may change; check https://resend.com/pricing before launch. Supabase Auth also applies rate limits. Do not repeatedly resend messages from a loop or allow unlimited repeat requests.

## Application behavior

- Signup calls Supabase Auth and tells the user to check email when confirmation is required.
- Resend confirmation uses Supabase Auth's `resend({ type: 'signup', ... })` API and the UI cooldown.
- Forgot password calls `resetPasswordForEmail` and uses the app's recovery callback.
- A recovery event requests a new password via Supabase Auth's `updateUser({ password })` method.
- Errors are shown without logging keys, tokens, or passwords.
- UI success means the Auth provider accepted the request; it does not prove delivery. Verify actual delivery in Resend's logs and through a controlled mailbox test.

## SMS is separate

Resend is email SMTP/API, not SMS. Phone OTP requires a supported SMS provider configured with the Auth service and may incur charges. Keep phone verification disabled unless its provider, pricing, and delivery path have been deliberately configured and tested.

## Official documentation

- Supabase custom SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase Auth rate limits: https://supabase.com/docs/guides/auth/rate-limits
- Resend SMTP credentials: https://resend.com/changelog/smtp-service
- Resend pricing: https://resend.com/pricing
