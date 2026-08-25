import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'node:path';

const r = (p) => resolve(import.meta.dirname, p);

// Deploy base. Cloudflare Pages serves at the domain root ("/"), so that's the
// default. GitHub Pages serves the project at "/uward/" — its workflow sets
// BASE_PATH=/uward/. Same source, both hosts.
const base = process.env.BASE_PATH || '/';

// Inject a PAGE-RELATIVE manifest link + apple-touch-icon into every entry, so
// each tool installs as its OWN app launching at its OWN url. The manifest file
// sits next to each index.html (public/tools/<id>/manifest.webmanifest) with a
// relative start_url ("./"), so this is base-agnostic (works on Cloudflare "/"
// and GitHub Pages "/uward/"). Injected post-transform so Vite doesn't try to
// resolve the relative hrefs as bundled assets.
function perPageManifestLinks() {
  return {
    name: 'per-page-manifest-links',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const depth = ctx.path.replace(/^\//, '').split('/').length - 1; // dirs above the file
        const up = depth ? '../'.repeat(depth) : '';
        return {
          html,
          tags: [
            // Apply saved/system theme before paint (no flash of the wrong theme).
            {
              tag: 'script',
              injectTo: 'head-prepend',
              children:
                "(function(){try{var k='uward-theme',t=localStorage.getItem(k);" +
                "if(t!=='dark'&&t!=='light'){t='light';}" +
                "document.documentElement.setAttribute('data-theme',t);}catch(e){}})();",
            },
            { tag: 'link', attrs: { rel: 'manifest', href: 'manifest.webmanifest' }, injectTo: 'head' },
            { tag: 'link', attrs: { rel: 'apple-touch-icon', href: up + 'icons/icon-192.png' }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' }, injectTo: 'head' },
            { tag: 'meta', attrs: { name: 'mobile-web-app-capable', content: 'yes' }, injectTo: 'head' },
            // Shared Inter webfont on every page (graceful system fallback offline).
            { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' }, injectTo: 'head' },
            { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }, injectTo: 'head' },
            { tag: 'link', attrs: { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' }, injectTo: 'head' },
          ],
        };
      },
    },
  };
}

// Multi-page app: every tool is its own HTML entry so it gets its own URL
// (installable / add-to-home-screen independently). Add new tools here.
const pages = {
  hub:    r('index.html'),
  ga:     r('tools/ga/index.html'),
  bili:   r('tools/bili/index.html'),
  avg:    r('tools/avg/index.html'),
  growth: r('tools/growth/index.html'),
  ward:   r('tools/ward/index.html'),
};

export default defineConfig({
  // Vite rewrites all asset URLs to content-hashed filenames under this base,
  // which is what makes stale caches impossible (a new build = new URLs).
  base,
  build: {
    target: 'es2020',
    rollupOptions: { input: pages },
  },
  plugins: [
    perPageManifestLinks(),
    VitePWA({
      registerType: 'autoUpdate',     // new service worker takes over automatically
      injectRegister: 'auto',
      includeAssets: ['icons/*'],
      // We author per-page manifests ourselves (public/**/manifest.webmanifest)
      // so each tool installs as its own app — see perPageManifestLinks().
      manifest: false,
      workbox: {
        // Precache code + html + small data so every tool works offline.
        globPatterns: ['**/*.{js,css,html,json,webmanifest,svg,woff,woff2,ico}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Don't bloat the precache with the ~16MB of growth-chart images:
        // cache them at runtime on first use instead.
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'uward-images',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
