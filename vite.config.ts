import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// BASE_PATH is set by the GitHub Pages workflow (e.g. "/<repo-name>/").
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Kinesis',
        short_name: 'Kinesis',
        description: 'Plan and follow bodyweight strength, stretching and mobility sessions.',
        theme_color: '#c2410c',
        background_color: '#f7f4f2',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
    coverage: { provider: 'v8', include: ['src/store/**', 'src/lib/**', 'src/player/**', 'src/data/**'], reporter: ['text', 'text-summary'] },
  },
})
