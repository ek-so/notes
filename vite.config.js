import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    react(),
    // Service worker caches the app itself so it opens offline. Notes are
    // cached separately in IndexedDB (src/lib/cache.js).
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,json}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  base: command === 'serve' ? '/' : '/folio/',
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
  },
}))
