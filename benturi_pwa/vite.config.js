import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: true,
    port: 3333,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Método Bénturi',
        short_name: 'Bénturi',
        description: 'Un espacio personal de reflexión guiada.',
        theme_color: '#8BB9D3',
        background_color: '#8BB9D3',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      // Las cartas se cargan bajo demanda: precargarlas todas haría que la
      // primera instalación descargase más de 50 MB.
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,json}'],
        globIgnores: ['**/assets/cards/**'],
      },
    }),
  ],
})
