import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readdirSync } from 'node:fs';

// Every *.html file in the project root is a page.
const root = import.meta.dirname;
const input = Object.fromEntries(readdirSync(root).filter((f) => f.endsWith('.html') && !f.startsWith('_')).map((f) => [f.replace('.html', ''), resolve(root, f)]));

export default defineConfig({
  base: './',
  // pre-bundle up front so dev never re-optimizes mid-session
  optimizeDeps: { include: ['pixi.js', '@pixi/3d', '@pixi/3d/extras'] },
  server: { port: 5179 },
  build: { rollupOptions: { input }, chunkSizeWarningLimit: 1600 }
});
