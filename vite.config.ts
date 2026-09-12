/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// GitHub Pages serves the site from https://nick-shimpo.github.io/blades_in_the_dark_vtt/
// so every asset URL has to be prefixed with the repository name.
const base = process.env.VITE_BASE ?? '/blades_in_the_dark_vtt/';

export default defineConfig({
  base,
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'preact',
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        // keep the big, never-changing game data in its own long-cached chunk
        manualChunks: {
          gamedata: [
            './src/data/book.json',
            './src/data/sheets.json',
            './src/data/sparks.json',
            './src/data/claims-maps.json',
          ],
          firebase: ['firebase/app', 'firebase/database'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
