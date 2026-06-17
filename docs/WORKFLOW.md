# Development workflow (production + previews)

The gold standard for a static PWA: **`main` is always production**, every change goes
through a **short-lived branch → Pull Request → preview deploy → merge**, and the live URL
**auto-updates** (content-hashed assets + auto-updating service worker).

## Environments

| Branch / PR | Where it deploys | Purpose |
|---|---|---|
| `main` | production | what users run |
| `dev` | a Cloudflare preview URL (e.g. `dev.uward.pages.dev`) | integration / test on your phone |
| any PR | a unique Cloudflare preview URL | review a single change in isolation |

Each Cloudflare preview is its own subdomain = its own origin, so its service worker and
cache are **fully isolated** from production — testing a branch can never corrupt the prod
PWA on your phone.

The build base path is environment-driven (`vite.config.js`): default `/` (Cloudflare),
and the GitHub Actions workflow sets `BASE_PATH=/uward/` so GitHub Pages keeps working too.

## Day-to-day

```bash
git switch -c fix/something      # start a short-lived branch off main
# ...edit, then:
npm run build                    # sanity check it builds
git commit -am "fix: ..." && git push -u origin fix/something
# open a PR -> Cloudflare comments a preview URL -> test on your phone
# merge the PR -> main auto-deploys to production
```

For quick experiments, push to `dev` and test at the dev preview URL before promoting to
`main` (open a PR `dev → main`).

## One-time: connect Cloudflare Pages (needs your login)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick
   `phuriphatma/uward`.
2. Build settings: **Framework preset = none**, **Build command = `npm run build`**,
   **Build output directory = `dist`**. (Node 20+.)
3. **Production branch = `main`.** Leave preview deployments enabled for all other branches.
4. Save & deploy. Production = `uward.pages.dev` (add a custom domain later if you like);
   `dev` and PRs get their own preview URLs automatically.

GitHub Pages (`phuriphatma.github.io/uward/`) keeps deploying from `main` via
`.github/workflows/deploy.yml`, so nothing breaks during the switch — you can retire it once
you're happy with Cloudflare.

## Recommended repo settings

- Protect `main`: require a PR + a green build before merge (Settings → Branches).
- Keep the **build SHA in the hub footer** as the quick "what's live?" check.

## Rollback

Cloudflare Pages keeps every deployment — open the project → Deployments → pick a previous
one → **Rollback**. (On Pages: revert the commit and push.)
