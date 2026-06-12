import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

// Custom plugin to emulate Vercel's serverless api folder in development
const vercelApiEmulatorPlugin = () => ({
  name: 'vercel-api-emulator',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url && req.url.startsWith('/api/')) {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;
        const match = pathname.match(/^\/api\/([a-zA-Z0-9_\-]+)$/);

        if (match) {
          const endpoint = match[1];
          try {
            // Emulate helper response methods standard in Express / Vercel Serverless
            res.status = (code) => {
              res.statusCode = code;
              return res;
            };
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return res;
            };

            // Parse body for POST requests
            if (req.method === 'POST') {
              req.body = await parseJsonBody(req);
            } else {
              req.body = {};
            }

            const modulePath = `./api/${endpoint}.js`;
            const module = await import(modulePath);
            if (module && module.default) {
              await module.default(req, res);
              return;
            }
          } catch (err) {
            console.error(`[API Emulator] Lỗi chạy API /api/${endpoint}:`, err);
            // Don't respond with 404, output error JSON
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message || 'Lỗi chạy API.' }));
            return;
          }
        }
      }
      next();
    });
  }
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), vercelApiEmulatorPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
