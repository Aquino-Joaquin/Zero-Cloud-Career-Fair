import { recordNetwork } from './metrics'
import type { Mode } from './settings'

/** fetch + registro de bytes y tiempo reales en el modo indicado. */
export async function fetchJson<T>(url: string, mode: Mode): Promise<T> {
  const start = performance.now()
  let res: Response
  try {
    res = await fetch(url, { cache: 'no-store' })
  } catch {
    // navigator.onLine puede ser true aunque el servidor local no responda.
    throw new Error(`local server not reachable at ${window.location.origin}`)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  recordNetwork(mode, new Blob([text]).size, performance.now() - start)
  return JSON.parse(text) as T
}
