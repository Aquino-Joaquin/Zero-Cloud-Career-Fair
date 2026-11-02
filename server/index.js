// Servidor local de Zero-Cloud Career Fair.
// Sirve la app compilada (dist/) y la API (/api/*) en la red local, sin dependencias.
//   pnpm serve   -> compila y arranca
//   pnpm start   -> arranca (usa el dist/ existente)
// Usa HTTPS automáticamente si existe certs/ (generado con `pnpm cert`).
import { existsSync, readFileSync, createReadStream, statSync } from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import { networkInterfaces } from 'node:os'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleApi } from './api.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(ROOT, 'dist')
const CERTS = join(ROOT, 'certs')
const PORT = Number(process.env.PORT) || 3000

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('No existe dist/. Ejecuta primero:  pnpm build   (o usa  pnpm serve)')
  process.exit(1)
}

function serveFile(res, file) {
  const name = file.slice(DIST.length + 1)
  // Archivos con hash en el nombre: caché larga. sw.js e index.html: siempre revalidar.
  const cache = name.startsWith(`assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache'
  res.writeHead(200, {
    'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
    'Content-Length': statSync(file).size,
    'Cache-Control': cache,
  })
  createReadStream(file).pipe(res)
}

function serveStatic(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end()
    return
  }
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
  const file = normalize(join(DIST, path))
  if (!file.startsWith(DIST + sep)) {
    res.writeHead(403).end()
    return
  }
  if (existsSync(file) && statSync(file).isFile()) return serveFile(res, file)
  // Rutas de la SPA (/company/x, /dashboard...) -> index.html. Archivos inexistentes -> 404.
  if (extname(path)) {
    res.writeHead(404).end('Not found')
    return
  }
  serveFile(res, join(DIST, 'index.html'))
}

const handler = (req, res) => {
  const start = Date.now()
  res.on('finish', () => {
    if (req.url?.startsWith('/api/')) {
      console.log(`${req.method} ${req.url} ${res.statusCode} ${res.getHeader('Content-Length') ?? '-'} B ${Date.now() - start} ms`)
    }
  })
  handleApi(req, res, () => serveStatic(req, res))
}

const useHttps = existsSync(join(CERTS, 'key.pem')) && existsSync(join(CERTS, 'cert.pem'))
const server = useHttps
  ? https.createServer({ key: readFileSync(join(CERTS, 'key.pem')), cert: readFileSync(join(CERTS, 'cert.pem')) }, handler)
  : http.createServer(handler)

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nEl puerto ${PORT} ya está en uso (¿otro servidor o un contenedor Docker?).`)
    console.error(`  Ver quién lo usa:   lsof -i :${PORT}`)
    console.error('  Parar Docker:       docker stop $(docker ps -q)')
    console.error(`  U otro puerto:      PORT=3001 pnpm start\n`)
    process.exit(1)
  }
  throw err
})

server.listen(PORT, '0.0.0.0', () => {
  const proto = useHttps ? 'https' : 'http'
  const ips = Object.values(networkInterfaces())
    .flat()
    .filter((a) => a && a.family === 'IPv4' && !a.internal)
    .map((a) => a.address)
  console.log(`\nZero-Cloud local server (${useHttps ? 'HTTPS' : 'HTTP'})`)
  console.log(`  Local:   ${proto}://localhost:${PORT}`)
  for (const ip of ips) console.log(`  Network: ${proto}://${ip}:${PORT}`)
  if (!useHttps) console.log('\n  Sin certificado: el modo offline solo funciona en localhost. Ejecuta `pnpm cert` para HTTPS.')
  console.log('\n  Las peticiones a /api/* se muestran aquí abajo:\n')
})

// Dentro de Docker, Node es el proceso principal (PID 1) e ignora Ctrl+C si no lo manejamos.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log('\nCerrando servidor...')
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 1000).unref()
  })
}
