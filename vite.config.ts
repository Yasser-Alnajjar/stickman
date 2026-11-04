import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

/**
 * `__DEV_TOOLS__` is substituted at build time. It is true only for the dev server (`vite`) and for an explicit
 * `--mode devtools` build; `vite build` (what `npm run build` and the Android APK use) always yields `false`, so the
 * bundler removes every guarded branch and the dynamically imported `src/devtools/*` chunk is never emitted.
 */
export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  base: './',
  define: { __DEV_TOOLS__: JSON.stringify(command === 'serve' || mode === 'devtools') },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: { manualChunks: (id: string) => (id.includes('node_modules/phaser') ? 'phaser' : undefined) },
    },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
}));
