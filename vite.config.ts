import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

/**
 * Plugin untuk memastikan:
 * 1. dist/index.html disalin ke dist/404.html (untuk SPA routing di GitHub Pages)
 * 2. dist/assets dan dist/index.html disinkronkan ke root folder jika dideploy langsung dari branch main
 */
function githubPagesBuildPlugin(): Plugin {
  return {
    name: 'github-pages-build-plugin',
    closeBundle() {
      try {
        const rootDir = process.cwd();
        const distDir = path.resolve(rootDir, 'dist');
        const indexPath = path.join(distDir, 'index.html');
        const notFoundPath = path.join(distDir, '404.html');

        // 1. Buat dist/404.html untuk GitHub Pages SPA
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, notFoundPath);
          console.log('[GitHub Pages] Berhasil membuat dist/404.html dari dist/index.html');

          // 2. Salin juga ke root 404.html
          fs.copyFileSync(indexPath, path.join(rootDir, '404.html'));
        }

        // 3. Salin file-file aset terkompilasi ke ./assets di root
        const distAssetsDir = path.join(distDir, 'assets');
        const rootAssetsDir = path.join(rootDir, 'assets');
        if (fs.existsSync(distAssetsDir)) {
          fs.cpSync(distAssetsDir, rootAssetsDir, { recursive: true });
          console.log('[GitHub Pages] Berhasil menyinkronkan seluruh aset ke folder root ./assets');
        }
      } catch (err) {
        console.warn('[GitHub Pages] Warning saat menyalin build asset:', err);
      }
    }
  };
}

export default defineConfig(() => {
  return {
    base: '/Sistem-Arsip-LSP/',
    plugins: [react(), tailwindcss(), githubPagesBuildPlugin()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/app-bundle.js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name].[ext]'
        }
      }
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
