# Mistakes & gotchas

Add a dated entry when a root cause was non-obvious.

## 2026-06-17 — Vite won't bundle classic `<script src>`; files vanished from dist

Migrating the vanilla tools, the build warned `<script src="app.js"> ... can't be bundled
without type="module"` and the files were **not copied to `dist/`** → 404 at runtime.
Making them `type=module` would break global scope and inline `onclick=` handlers.
**Fix:** put each tool's classic/global JS in `public/tools/<id>/` so it's served verbatim
at the path the HTML references; Workbox precaches it with a content revision (freshness
still correct). CSS referenced via `<link>` and the tool HTML stay as Vite-processed source.

## 2026-06-17 — original cache bug (the reason this repo exists)

The old `testbili/sw.js` was **cache-first at stable URLs**: once cached, assets were served
forever, even online. Updates never reached devices. uWard fixes it with content-hashed
filenames + a Workbox `autoUpdate` worker (revisioned precache, skipWaiting/clientsClaim).
**Never** reintroduce a cache-first fetch handler or un-revisioned code URLs.

## A tool with its own fixed top:0 header overlaps the shell bar

`avg`'s `.mobile-average-bar` was `position:fixed; top:0; z-index:2000`, covering the shell
bar so you couldn't navigate out. **Fix:** offset such headers (`top:52px`) and keep them
below the shell's z-index (2000). Watch for this when migrating tools with sticky/fixed
chrome (the ward sidebar needed the same `top` offset on phones).

## CDN libs break offline

flatpickr (ga) and CryptoJS/XLSX (ward) were loaded from CDNs as classic globals. Offline
they'd be undefined. **Fix:** vendor their built files into `public/vendor/` and load them
as classic scripts (preserves global + load order). Don't convert these to ES imports — the
consuming code expects globals and runs as classic scripts.

## Asset paths in runtime JS strings aren't rewritten by Vite

growth's `script.js` builds image/JSON URLs as strings (`fetch('x.json')`). Vite can't
rewrite strings, so those files must sit at the page-relative path at runtime → they live in
`public/tools/growth/` and resolve against `/uward/tools/growth/`. Big PNGs are runtime-cached
(not precached) via the Workbox image rule to keep installs small.
