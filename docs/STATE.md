# State & roadmap

## Current (2026-06-17)

- Consolidated `testbili` (ga, bili+weight-delta, avg), `demo-growthchart` (growth +
  milestones), and `wardmanagement` (ward) into this Vite MPA PWA.
- Hub + shared shell (sticky bar: Home · title · tool switcher) built and verified at phone
  width for all 6 pages.
- PWA: Workbox `autoUpdate`, precache ~42 entries (~2.9 MB); big growth PNGs runtime-cached.
- **Offline verified**: server stopped, hub still rendered from the service worker.
- CDN deps (crypto-js, xlsx, flatpickr) vendored locally for offline.
- CI: `.github/workflows/deploy.yml` builds + deploys to Pages on push to `main`.

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
