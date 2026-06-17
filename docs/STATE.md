# State & roadmap

## Current (2026-06-17)

- Consolidated `testbili` (ga, bili+weight-delta, avg), `demo-growthchart` (growth +
  milestones), and `wardmanagement` (ward) into this Vite MPA PWA.
- Hub + shared shell (sticky bar: Home · title · tool switcher) built and verified at phone
  width for all 6 pages.
- PWA: Workbox `autoUpdate`, precache ~42 entries (~2.9 MB); big growth PNGs runtime-cached.
- **Offline verified**: server stopped, hub still rendered from the service worker.
- CDN deps (crypto-js, xlsx, flatpickr, **mathjs**) vendored locally for offline.
- CI: `.github/workflows/deploy.yml` builds + deploys to Pages on push to `main`.

## QA pass (2026-06-17, later)

- Fixed: `avg` loaded math.js from the unpkg CDN → **broke offline**; now vendored
  (`public/vendor/math.js`, page-relative load).
- Removed: `avg` "Force Refresh" button + its `forceRefresh()` (unregistered all SWs / wiped
  all caches — harmful & redundant with autoUpdate); same dead code + a stray manual
  `../../sw.js` registration removed from `bili`.
- Build base is now env-driven (`BASE_PATH`): default `/` (Cloudflare), `/uward/` for Pages.
- Added `public/_headers` (immutable hashed assets; no-cache `sw.js`/manifest; security headers).
- Workflow documented in `docs/WORKFLOW.md`: `main`=prod, `dev`+PRs=Cloudflare previews.
- Inherently-online (not offline) features, by design: bili's PediTools API fetch (via the
  `api.codetabs.com` proxy — third-party dependency) and ward's Google-Sheet import.

## Post-deploy checklist

- [ ] Pages source set to **GitHub Actions**; first deploy green.
- [ ] On a phone: install the PWA; add a tool URL (e.g. `/uward/tools/ga/`) to the home
      screen and confirm it opens standalone.
- [ ] **Update test**: change something, push, confirm the phone shows the new `build` SHA
      in the hub footer **without** clearing cache.
- [ ] Offline test on-device (airplane mode) — tools still open.

## Known follow-ups (not blocking)

- "Settings" never existed in `testbili` (dead `settings/settings.html` link) — omitted from
  the hub. Build it as a real tool later if wanted.
- Per-tool UI polish to the shared design system (this pass only unified shell + hub).
- `bili` still has leftover "Main App" / "Force Refresh" buttons from the old cache-fighting
  UI — harmless; remove during bili polish.
- Old repos (`testbili`, `demo-growthchart`, `wardmanagement`) left intact; archive / add
  pointers once uWard is confirmed live (confirm before changing them).
