import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gera lista completa de assets para pre-cache
function getAssetList(): string[] {
  const assetsDir = path.resolve(__dirname, 'public/assets');
  const result: string[] = [];
  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        const rel = '/' + path.relative(path.resolve(__dirname, 'public'), full).replace(/\\/g, '/');
        result.push(rel);
      }
    }
  }
  walk(assetsDir);
  return result;
}

const gameAssets = getAssetList();

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB (magic effects PNGs)
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,webp,json,tmj,woff,woff2}'
        ],
        // Cache de todos os assets do jogo
        additionalManifestEntries: gameAssets.map(url => ({
          url,
          revision: null,
        })),
        runtimeCaching: [
          {
            urlPattern: /\/assets\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'game-assets-v1',
              expiration: {
                maxEntries: 2000,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.tmj$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'game-maps-v1',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 dias
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
      ],
      manifest: false, // Usando manifest.webmanifest externo
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
    {
      name: 'serve-root-tiled-maps',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const urlPath = req.url?.split('?')[0] || '';
          if (urlPath.endsWith('.tmj')) {
            const fileName = path.basename(urlPath);
            const rootPath = path.resolve(__dirname, fileName);
            if (fs.existsSync(rootPath)) {
              const content = fs.readFileSync(rootPath, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'no-store');
              res.end(content);
              return;
            }
          }
          if (urlPath === '/api/save-offsets' && req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const itemName = data?.metadata?.itemName || 'gold_sword';
                const fileName = itemName.includes('wood') ? 'wood_sword_offsets.json' : 'gold_sword_offsets.json';
                const jsonPath = path.resolve(__dirname, `public/assets/itens/positions/${fileName}`);
                fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (err: unknown) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                const msg = err instanceof Error ? err.message : String(err);
                res.end(JSON.stringify({ success: false, error: msg }));
              }
            });
            return;
          }

          next();
        });
      },
    },
  ],
});
