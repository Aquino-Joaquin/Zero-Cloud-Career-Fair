import type { Company, Dataset } from '../types'
import { clearDatabase, getAllCompanies, getCompanyById } from './database'
import { fetchJson } from './http'
import { recordView, resetMetrics } from './metrics'
import { getMode } from './settings'

/*
 * Punto único de acceso a los datos para las páginas.
 *   zero-cloud:  lee de IndexedDB (0 bytes de red); sync.ts mantiene IndexedDB al día.
 *   traditional: pide los datos al servidor en cada vista, como una plataforma en la nube.
 * En ambos casos se registra cada vista (tiempo, éxito, offline) en su propio contador.
 */
const byBooth = (a: Company, b: Company) => a.booth.localeCompare(b.booth)

export async function getCompanies(): Promise<Company[]> {
  const mode = getMode()
  const start = performance.now()
  try {
    const companies =
      mode === 'traditional'
        ? (await fetchJson<Dataset>('/api/companies', mode)).companies.sort(byBooth)
        : await getAllCompanies()
    if (companies.length > 0) recordView(mode, performance.now() - start, true)
    return companies
  } catch {
    recordView(mode, 0, false)
    return []
  }
}

export async function getCompany(id: string): Promise<Company | undefined> {
  const mode = getMode()
  const start = performance.now()
  try {
    const company =
      mode === 'traditional'
        ? await fetchJson<Company>(`/api/companies/${encodeURIComponent(id)}`, mode)
        : await getCompanyById(id)
    if (company) recordView(mode, performance.now() - start, true)
    return company
  } catch {
    recordView(mode, 0, false)
    return undefined
  }
}

/** Para repetir la demo desde cero: borra IndexedDB y las métricas. */
export async function resetDemo(): Promise<void> {
  await clearDatabase()
  resetMetrics()
}

export { onDataChange, syncData } from './sync'
