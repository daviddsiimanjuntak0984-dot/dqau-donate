# Dqau Donate

Dqau Donate is a responsive creator-support community built with React, TypeScript, Vite, and Supabase. It supports real creator profiles and community activity; it does not insert demo creators or fake statistics into the live creator list.

## Current features

- Public creator discovery and shareable `/u/{username}` profile routes.
- Creator avatar, cover, bio, album, social links, posts, follows, likes, comments, and 24-hour stories (requires the corresponding database migration and Storage policies).
- Email/password auth and configured OAuth/SMS options from Supabase Auth.
- Accessible loading, error, empty, and configuration states with keyboard focus styling.
- OBS overlay preview at `/?overlay=1&preview=1&demo=1`. The demo alert is explicitly labelled as not a real transaction.
- PWA/service-worker support.

## Environment configuration

Use only a Supabase **publishable key** (`sb_publishable_...`) or legacy **anon** JWT for the browser client. Never put a `service_role`, `sb_secret_*`, Midtrans server key, or any other privileged credential in the frontend, `VITE_*` variables, or Git.

Required variable names:

- `VITE_SUPABASE_URL` — Supabase project URL.
- `VITE_SUPABASE_ANON_KEY` — a public publishable/anon key. The historical name remains for compatibility with existing deployments.

Copy `.env.example` to `.env.local` for local development and replace the placeholder with your public client key. Local `.env*` files are ignored by Git.

### Cloudflare Pages

For a Vite static build, `import.meta.env.VITE_*` values are embedded at build time. `vite.config.ts` prints a safe diagnostic identifying the build mode/Pages branch and **only the names** of missing or invalid variables; it never logs configuration values.

A Pages runtime fallback is also available at `functions/api/supabase-config.ts`. It lets the app read the public client configuration from the current deployment's Pages Function environment when a value is stored as a runtime Variables/Secret binding instead of being present in the Vite build process. The endpoint is non-cacheable and returns only the public Supabase client credentials needed by the browser. It rejects service-role and secret keys.

Set the variables in the appropriate **Production** and **Preview** environments for your chosen deployment method, then redeploy. If configuration is unavailable, the app still renders and names only the missing/invalid variables; authentication and database operations remain disabled rather than pretending to work.

Recommended Pages settings:

- Framework preset: **Vite**
- Root directory: repository root
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`; review changes on branch `ui/modernize` / PR #4 before merging.

See [Cloudflare Pages deployment and diagnostics](docs/CLOUDFLARE_PAGES.md).

For Supabase Auth email confirmation, resend-confirmation, and password recovery using Resend SMTP, see [Email verification with Resend](docs/EMAIL_VERIFICATION_RESEND.md). For donation feature gating and 5% commission accounting, see [Donation and overlay setup](docs/DONATIONS_SETUP.md).

## Local development and checks

```bash
npm install
npm run dev
npm run build
```

The build includes TypeScript type-checking for both `src/` and Cloudflare Pages `functions/`, then creates the Vite production bundle. There is currently no separate lint or unit-test script configured in `package.json`.

## Payment safety boundary

No production payment gateway, QRIS/e-wallet processing, donation payout, or withdrawal flow is enabled by this UI/configuration task. The donation payment implementation remains gated and must not be treated as production-ready without explicit approval and an end-to-end sandbox/security review.
