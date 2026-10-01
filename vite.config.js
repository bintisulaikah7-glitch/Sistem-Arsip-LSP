import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

/**
 * Plugin untuk menduplikasi dist/index.html menjadi dist/404.html secara otomatis saat proses build.
 * Sangat krusial untuk SPA di GitHub Pages agar direct URL & query parameter (?box=...) tidak blank screen.
 */
function copyIndexTo404Plugin() {
  return {
    name: 'copy-index-to-404',
    closeBundle() {
      try {
        const distDir = path.resolve(process.cwd(), 'dist');
        const indexPath = path.join(distDir, 'index.html');
        const notFoundPath = path.join(distDir, '404.html');
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, notFoundPath);
          console.log('[GitHub Pages SPA] Berhasil membuat dist/404.html dari dist/index.html');
        }
      } catch (err) {
        console.warn('[GitHub Pages SPA] Gagal menyalin index.html ke 404.html:', err);
      }
    }
  };
}

export default defineConfig(() => {
  return {
    base: '/Sistem-Arsip-LSP/',
    plugins: [react(), tailwindcss(), copyIndexTo404Plugin()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
