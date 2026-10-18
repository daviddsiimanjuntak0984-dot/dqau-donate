# Cloudflare Pages deployment and diagnostics

## Build configuration

Use these settings for the Git-integrated Cloudflare Pages project:

- **Framework preset:** Vite
- **Root directory:** repository root (blank if Cloudflare uses the repo root by default)
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Production branch:** `main`; use the Preview deployment for `ui/modernize` while reviewing PR #4.

Vite's source `index.html` references `/src/main.tsx`; the built `dist/index.html` must instead reference generated files under `/assets/`. If the published site leaves the loading shell visible indefinitely, inspect the deployment's actual published HTML and asset requests first—the source `index.html` may have been published instead of `dist/`.

## Supabase configuration: build time and runtime

Vite replaces `import.meta.env.VITE_*` during build. A value that is visible in the dashboard is not proof that the currently served bundle contains it: the deployment must have been built after the value was configured, and Preview and Production may use different environments.

The repository now diagnoses both paths:

1. **Build-time path:** `vite.config.ts` reads the active Vite mode and dotenv files and logs only whether the public configuration variable names are present. On Pages it also records the deployment branch name. It never logs the URL or key values.
2. **Runtime fallback:** `functions/api/supabase-config.ts` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the active Pages Function environment. This supports deployments where encrypted Variables/Secrets are present for the runtime Function but were not available to the Vite build.
3. **Safe failure:** if either path is not configured, the app renders its UI, reports only the missing/invalid variable names, and disables Supabase operations. It does not simulate a successful login.

Make sure both variables are assigned to the environments that are actually deployed:

- **Production:** the `dqau-donate.pages.dev` production deployment.
- **Preview:** the branch-preview environment used to test PR #4.

The browser needs a Supabase **publishable** key or legacy **anon** key. Do not use a `service_role`, `sb_secret_*`, Midtrans server key, or any other privileged secret in a browser-facing variable. The same-origin runtime endpoint returns the public client key to the browser because Supabase's anon/publishable key is explicitly intended for public clients; it never logs the value, uses `Cache-Control: no-store`, and rejects privileged key types.

After setting or changing Pages variables, create a fresh deployment for the corresponding environment. A pre-existing deployed bundle is not changed by editing configuration in the dashboard.

## Diagnosing a blank page or missing configuration

1. Open the latest deployment for the affected environment and inspect its build log for `[Dqua build config]`. The message names the missing variables without showing their values and identifies the branch/mode.
2. Confirm the deployed output is `dist`, not the repository root. The built HTML should load `/assets/*.js` and `/assets/*.css`, not `/src/main.tsx`.
3. If the runtime fallback was needed, inspect the browser Network panel for a same-origin `GET /api/supabase-config`; the app itself shows only variable names if that endpoint is unavailable or incomplete. Do not copy or publish the endpoint response because it contains public client configuration.
4. If old UI still appears after a valid deployment, hard-refresh. In browser DevTools → Application → Service Workers, unregister an old worker once and clear stale site data, then reload.

The app's startup loader remains visible while it initializes the runtime configuration. If JavaScript fails before `src/main.tsx` loads, the loader may remain; this is an indicator to inspect the published HTML and asset paths rather than assume Supabase alone caused it.
