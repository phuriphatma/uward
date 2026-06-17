# CLAUDE.md — uWard

Guide for working in this repo with Claude Code. Read this first.

## What this is

A **Vite multi-page PWA** that consolidates several vanilla clinical tools (formerly the
`testbili`, `demo-growthchart`, and `wardmanagement` repos) into one installable,
offline-capable app, deployed to GitHub Pages at `/uward/`. Each tool is its own page/URL;
a shared shell + hub provide navigation. No SPA framework — the tools stay vanilla.

## Layout

```
index.html              Hub launcher (Vite entry). Grouped by ward.
src/hub.{js,css}        Hub rendering.
src/shell/shell.{js,css}  Sticky top bar (Home · title · Switch-tool sheet). Imported by every tool page.
src/shell/tools.js      SINGLE SOURCE OF TRUTH for the tool catalogue (hub + switcher read it).
tools/<id>/index.html   Each tool's page (Vite entry). + bundled CSS (e.g. bili styles.css).
public/tools/<id>/...   Each tool's CLASSIC JS + large data assets, served verbatim (see gotcha).
public/vendor/...       Vendored classic libs (crypto-js, xlsx, flatpickr) — offline, no CDN.
public/icons/...        PWA icons (generated from icon.svg via rsvg-convert).
vite.config.js          MPA inputs, base:'/uward/', PWA (autoUpdate) + runtime image cache.
.github/workflows/deploy.yml   Build + deploy to Pages on push to main.
```

## How to add a tool

1. Create `tools/<id>/index.html`; put classic/global JS + big assets in `public/tools/<id>/`.
2. Add the entry to `pages` in `vite.config.js`.
3. Add it to `WARDS` in `src/shell/tools.js`.
4. Include the shell: `<script type="module" src="/src/shell/shell.js"></script>` before `</body>`.
5. `npm run build` (no warnings) and screenshot-check at phone width.

## Conventions / why

- **Classic, global, order-dependent tool scripts live in `public/`, not as Vite entries.**
  Vite refuses to bundle `<script src="x.js">` without `type=module`, and making them
  modules would break global scope + inline `onclick` handlers. Serving them verbatim from
  `public/` at the path the HTML expects preserves their behaviour; Workbox still precaches
  them with a content revision, so freshness is correct. See `docs/MISTAKES.md`.
- **No CDN** for runtime libs — they break offline. Vendor them in `public/vendor/` as
  classic scripts (preserves load order/globals) and reference with absolute `/vendor/...`.
- **Cache correctness is the whole point** — never reintroduce a cache-first SW or stable
  un-revisioned asset URLs for code. Keep `registerType:'autoUpdate'`.
- Shared design tokens are CSS vars in `src/shell/shell.css` (`--u-*`). Reuse them.

## Run / verify

- `npm run dev` then open `/uward/`.
- `npm run build && npm run preview`; screenshot tools at 390px with headless Chrome
  (`--headless=new --window-size=390,844 --screenshot=...`).
- **Offline test** (the headline feature): load with a persistent `--user-data-dir` (SW
  precaches), stop the server, reload — it should still render. Proven working 2026-06-17.
- After editing any tool's classic JS, remember it lives in `public/tools/<id>/`.

## Workflow (prod + previews)

`main` = production; `dev` and every PR get an isolated **Cloudflare Pages** preview URL.
Build base is env-driven (`BASE_PATH`): `/` for Cloudflare (default), `/uward/` for GitHub
Pages (set in the Actions workflow). Full details + Cloudflare connect steps: `docs/WORKFLOW.md`.

Update `docs/STATE.md` and `docs/MISTAKES.md` as you learn things.
