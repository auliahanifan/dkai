import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

function rootSalesCsvPlugin(): Plugin {
  const rootCsvPath = path.resolve(process.cwd(), 'sales.csv');

  return {
    name: 'root-sales-csv',
    configureServer(server) {
      server.middlewares.use('/sales.csv', (_req, res, next) => {
        if (!fs.existsSync(rootCsvPath)) {
          next();
          return;
        }
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        fs.createReadStream(rootCsvPath).pipe(res);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use('/sales.csv', (_req, res, next) => {
        if (!fs.existsSync(rootCsvPath)) {
          next();
          return;
        }
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        fs.createReadStream(rootCsvPath).pipe(res);
      });
    },
    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist');
      if (fs.existsSync(rootCsvPath) && fs.existsSync(distDir)) {
        fs.copyFileSync(rootCsvPath, path.join(distDir, 'sales.csv'));
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), rootSalesCsvPlugin()],
});
