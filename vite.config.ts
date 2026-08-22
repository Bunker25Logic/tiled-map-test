import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
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
          next();
        });
      },
    },
  ],
});
