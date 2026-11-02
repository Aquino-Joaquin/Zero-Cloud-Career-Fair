import { existsSync, readFileSync } from 'node:fs'
import { networkInterfaces } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { handleApi } from './server/api.js'

// IP de este ordenador en la red Wi-Fi, para que los QR funcionen desde un móvil.
function getLanHost(): string {
  for (const addrs of Object.values(networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family === 'IPv4' && !a.internal) return a.address
    }
  }
  return 'localhost'
}

// HTTPS si existe un certificado generado con `pnpm cert` (necesario para el
// Service Worker en móviles). Sin certificado, todo funciona por HTTP como antes.
const certDir = join(dirname(fileURLToPath(import.meta.url)), 'certs')
const https =
  existsSync(join(certDir, 'key.pem')) && existsSync(join(certDir, 'cert.pem'))
    ? { key: readFileSync(join(certDir, 'key.pem')), cert: readFileSync(join(certDir, 'cert.pem')) }
    : undefined

// Sirve /api/* desde server/data/companies.json en `pnpm dev` y `pnpm preview`.
function localApi(): Plugin {
  return {
    name: 'zero-cloud-local-api',
    configureServer(server) {
      server.middlewares.use(handleApi)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleApi)
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    localApi(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Zero-Cloud Career Fair',
        short_name: 'Zero-Cloud',
        description: 'Offline-first career fair: company profiles and jobs without the cloud.',
        theme_color: '#15803d',
        background_color: '#fafaf9',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        // El Service Worker solo guarda la app (HTML, JS, CSS).
        // Los datos van a IndexedDB, así la medición red vs. local queda limpia.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  server: { port: 5173, https },
  preview: { port: 4173, https },
  define: {
    __LAN_HOST__: JSON.stringify(getLanHost()),
  },
})
