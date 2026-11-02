import type { Mode } from './settings'

/*
 * Métricas reales, separadas por modo, para comparar los dos sistemas
 * con el mismo escenario. Se guardan en localStorage para sobrevivir a recargas.
 */
export interface Bucket {
  requests: number // peticiones de red
  bytes: number // bytes descargados (cuerpo de la respuesta)
  networkMs: number // tiempo total en red
  views: number // vistas de página servidas (lista o perfil)
  viewMs: number // tiempo total hasta tener los datos de cada vista
  offlineViews: number // vistas servidas sin conexión
  failedViews: number // vistas que no se pudieron mostrar
}

export interface Metrics {
  'zero-cloud': Bucket
  traditional: Bucket
  lastSyncAt: string | null
  lastSyncResult: string | null
}

const KEY = 'zc-metrics-v2'
const emptyBucket = (): Bucket => ({
  requests: 0,
  bytes: 0,
  networkMs: 0,
  views: 0,
  viewMs: 0,
  offlineViews: 0,
  failedViews: 0,
})
const empty = (): Metrics => ({
  'zero-cloud': emptyBucket(),
  traditional: emptyBucket(),
  lastSyncAt: null,
  lastSyncResult: null,
})

let current: Metrics = load()
const listeners = new Set<(m: Metrics) => void>()

function load(): Metrics {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw)
    const base = empty()
    return {
      ...base,
      ...parsed,
      'zero-cloud': { ...base['zero-cloud'], ...parsed['zero-cloud'] },
      traditional: { ...base.traditional, ...parsed.traditional },
    }
  } catch {
    return empty()
  }
}

function save(next: Metrics) {
  current = next
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    /* sin almacenamiento: solo en memoria */
  }
  listeners.forEach((l) => l(current))
}

function patchBucket(mode: Mode, patch: (b: Bucket) => Partial<Bucket>) {
  const b = current[mode]
  save({ ...current, [mode]: { ...b, ...patch(b) } })
}

export function recordNetwork(mode: Mode, bytes: number, ms: number) {
  patchBucket(mode, (b) => ({ requests: b.requests + 1, bytes: b.bytes + bytes, networkMs: b.networkMs + ms }))
}

export function recordView(mode: Mode, ms: number, ok: boolean) {
  patchBucket(mode, (b) =>
    ok
      ? { views: b.views + 1, viewMs: b.viewMs + ms, offlineViews: b.offlineViews + (navigator.onLine ? 0 : 1) }
      : { failedViews: b.failedViews + 1 },
  )
}

export function recordSync(result: string) {
  save({ ...current, lastSyncAt: new Date().toISOString(), lastSyncResult: result })
}

export function getMetrics(): Metrics {
  return current
}

export function resetMetrics() {
  save(empty())
}

export function subscribeMetrics(listener: (m: Metrics) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
