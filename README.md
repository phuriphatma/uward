# uWard — unified clinical tools (PWA)

One installable, **offline-capable** home for the clinical tools that used to live in
separate repos: a hub that groups tools by "ward" (specialty) with one-tap switching, and
each tool keeps **its own URL** so you can add it to your phone's home screen.

Live: **https://phuriphatma.github.io/uward/**

## Tools

| Ward | Tool | URL |
|---|---|---|
| OB-GYN | GA Calculator | `/uward/tools/ga/` |
| Pediatrics | Bilirubin (AAP 2022) + Weight Delta | `/uward/tools/bili/` |
| Pediatrics | Average Calculator | `/uward/tools/avg/` |
| Pediatrics | Growth Chart + Milestones | `/uward/tools/growth/` |
| Ward Mgmt | Ward Manager | `/uward/tools/ward/` |

## Why this fixes the "updates never reach my phone" problem

The old apps used a **cache-first service worker at stable URLs**, so once a file was cached
it was served forever — updates never arrived, even online. uWard fixes this two ways:

1. **Content-hashed filenames** (Vite) for the shell/hub — a new deploy means new URLs, so a
   stale copy is impossible.
2. **An auto-updating service worker** (vite-plugin-pwa / Workbox, `registerType:'autoUpdate'`
   + `skipWaiting`/`clientsClaim`). Every file is precached with a **content revision**; when
   you deploy, the new worker activates, purges old caches, and the page picks up the new
   version. No manual cache-clearing.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173/uward/
npm run build      # -> dist/  (also generates the service worker)
npm run preview    # serve dist/ locally
```

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and deploys to
GitHub Pages. **Edit source and push — CI builds it.** (You no longer edit served files
directly.)

See [`CLAUDE.md`](CLAUDE.md) and [`docs/`](docs/) for architecture and gotchas.
