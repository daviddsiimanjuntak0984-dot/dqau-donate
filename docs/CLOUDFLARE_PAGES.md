# Cloudflare Pages deployment checklist

Use these settings for the Dqua Donate Vite project in Cloudflare Pages:

- **Framework preset:** Vite
- **Root directory:** leave blank (repository root)
- **Build command:** \`npm run build\`
- **Build output directory:** \`dist\`
- **Production branch:** \`main\`; use a Preview deployment for \`ui/modernize\` while reviewing pull request #4.

If the output directory is set to the repository root instead of \`dist\`, Cloudflare may serve the source \`index.html\` that points at \`/src/main.tsx\`, rather than Vite's compiled assets. The production build output should reference generated files under \`/assets/\`.

## Frontend environment variables

Set these under Settings → Environment variables for both Production and Preview environments as needed:

- \`VITE_SUPABASE_URL\`: the URL of the Supabase project intended for that deployment.
- \`VITE_SUPABASE_ANON_KEY\`: that project's public publishable/anon key.

Never set \`SUPABASE_SERVICE_ROLE_KEY\`, a payment server key, or any other server secret as a \`VITE_*\` variable. Vite exposes \`VITE_*\` values to the browser bundle.

For the production project currently documented in this repository, the URL is \`https://aaqfamoedywfjidwupou.supabase.co\`. Use the staging project URL for Preview only if that is the environment you intend to test against.

After changing build settings or environment variables, trigger a new Pages deployment. Verify the deployment log says the Vite build completed and the published output contains \`index.html\` plus generated \`assets/*.js\` and \`assets/*.css\` files.

## If an older browser still shows a blank page

1. Hard-refresh the page.
2. In browser DevTools → Application → Service Workers, unregister the old worker once and clear the site's cached data.
3. Reload and check DevTools → Console and Network for failed JavaScript/CSS assets.

The repository service worker is updated to use network-first navigation and remove old \`dqau-cache-*\` caches. The new behavior takes effect after a fresh deployment and the browser activates the updated worker.
