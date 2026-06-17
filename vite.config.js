import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'node:path';

const r = (p) => resolve(import.meta.dirname, p);

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
  // GitHub Pages serves the repo at /uward/. Vite rewrites all asset URLs to
  // content-hashed filenames under this base, which is what makes stale caches
  // impossible (a new build = new URLs).
  base: '/uward/',
  build: {
    target: 'es2020',
    rollupOptions: { input: pages },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',     // new service worker takes over automatically
      injectRegister: 'auto',
      includeAssets: ['icons/*'],
      manifest: {
        name: 'uWard — Clinical Tools',
        short_name: 'uWard',
        description: 'OB-GYN, Pediatrics & Ward Management tools — works offline.',
        theme_color: '#2563eb',
        background_color: '#eef2f7',
        display: 'standalone',
        start_url: '/uward/',
        scope: '/uward/',
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache code + html + small data so every tool works offline.
        globPatterns: ['**/*.{js,css,html,json,svg,woff,woff2,ico}'],
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
