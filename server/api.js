// API del servidor local. La usan el servidor de Vite (dev y preview) y,
// más adelante, el servidor Node independiente (server/index.js).
import { readFile } from 'node:fs/promises'

const DATA_FILE = new URL('./data/companies.json', import.meta.url)

// Se lee en cada petición para que los cambios en el JSON se vean sin reiniciar.
export async function loadDataset() {
  return JSON.parse(await readFile(DATA_FILE, 'utf8'))
}

function send(res, status, body) {
  const json = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Length', Buffer.byteLength(json))
  res.setHeader('Cache-Control', 'no-store')
  res.end(json)
}

/**
 * GET /api/companies            -> dataset completo
 * GET /api/companies/:id        -> una empresa (lo usa el modo tradicional)
 * GET /api/updates?since=<ISO>  -> solo las empresas con updatedAt posterior a "since"
 */
export async function handleApi(req, res, next) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  if (!url.pathname.startsWith('/api/')) return next?.()

  try {
    const data = await loadDataset()

    if (url.pathname === '/api/companies') {
      return send(res, 200, data)
    }

    const match = url.pathname.match(/^\/api\/companies\/([\w-]+)$/)
    if (match) {
      const company = data.companies.find((c) => c.id === match[1])
      return company ? send(res, 200, company) : send(res, 404, { error: 'Company not found' })
    }

    if (url.pathname === '/api/updates') {
      const since = Date.parse(url.searchParams.get('since') ?? '') || 0
      const companies = data.companies.filter((c) => Date.parse(c.updatedAt) > since)
      return send(res, 200, { version: data.version, updatedAt: data.updatedAt, companies })
    }

    send(res, 404, { error: 'Not found' })
  } catch (err) {
    send(res, 500, { error: String(err) })
  }
}
