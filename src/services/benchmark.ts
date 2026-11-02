import { getCompanies, getCompany } from './api'
import { clearDatabase } from './database'
import { resetMetrics } from './metrics'
import { getMode, setMode } from './settings'
import { syncData } from './sync'

/*
 * Mismo escenario en los dos modos, en el mismo dispositivo:
 *   1 vista del listado + N vistas de perfiles (recorriendo las empresas).
 * Zero-Cloud empieza con el dispositivo vacío, así que incluye su descarga inicial.
 */
export async function runBenchmark(profileViews = 20): Promise<void> {
  const previous = getMode()
  resetMetrics()
  try {
    setMode('traditional')
    const list = await getCompanies()
    if (list.length === 0) throw new Error('The local server is not reachable.')
    for (let i = 0; i < profileViews; i++) await getCompany(list[i % list.length].id)

    setMode('zero-cloud')
    await clearDatabase()
    const sync = await syncData()
    if (sync.status === 'error' || sync.status === 'offline') throw new Error('Initial sync failed.')
    const local = await getCompanies()
    for (let i = 0; i < profileViews; i++) await getCompany(local[i % local.length].id)
  } finally {
    setMode(previous)
  }
}
