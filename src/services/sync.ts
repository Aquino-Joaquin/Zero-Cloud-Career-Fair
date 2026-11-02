import type { Company, Dataset } from '../types'
import { getAllCompanies, saveCompanies, setMeta } from './database'
import { recordSync } from './metrics'
import { fetchJson } from './http'

export type SyncResult =
  | { status: 'full'; count: number }
  | { status: 'incremental'; count: number }
  | { status: 'offline' }
  | { status: 'error'; message: string }

const listeners = new Set<() => void>()

/** Avisa a las páginas cuando IndexedDB tiene datos nuevos. */
export function onDataChange(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function latestUpdate(companies: Company[]): string | null {
  if (companies.length === 0) return null
  return companies.reduce((max, c) => (c.updatedAt > max ? c.updatedAt : max), companies[0].updatedAt)
}

let running: Promise<SyncResult> | null = null

/**
 * Primera vez: descarga el dataset completo.
 * Después: pide solo las empresas modificadas desde la última actualización local.
 */
export function syncData(): Promise<SyncResult> {
  running ??= doSync().finally(() => {
    running = null
  })
  return running
}

async function doSync(): Promise<SyncResult> {
  if (!navigator.onLine) {
    recordSync('offline')
    return { status: 'offline' }
  }

  try {
    const local = await getAllCompanies()
    const since = latestUpdate(local)
    let result: SyncResult

    if (!since) {
      const data = await fetchJson<Dataset>('/api/companies', 'zero-cloud')
      await saveCompanies(data.companies)
      await setMeta('version', data.version)
      result = { status: 'full', count: data.companies.length }
    } else {
      const data = await fetchJson<Dataset>(`/api/updates?since=${encodeURIComponent(since)}`, 'zero-cloud')
      if (data.companies.length > 0) await saveCompanies(data.companies)
      await setMeta('version', data.version)
      result = { status: 'incremental', count: data.companies.length }
    }

    await setMeta('lastSyncAt', new Date().toISOString())
    recordSync(`${result.status}: ${result.count} companies`)
    if (result.count > 0) listeners.forEach((l) => l())
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    recordSync(`error: ${message}`)
    return { status: 'error', message }
  }
}
