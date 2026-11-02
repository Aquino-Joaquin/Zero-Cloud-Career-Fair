import { getCompanies, getCompany } from './api'
import { clearDatabase } from './database'
import { resetMetrics } from './metrics'
import { getMode, setMode, type Mode } from './settings'
import { syncData } from './sync'

/*
 * Escenario de un visitante: 1 vista del listado + N vistas de perfiles.
 * En Zero-Cloud cada visitante empieza con el dispositivo vacío,
 * así que se incluye su descarga inicial.
 * `attendees` repite el escenario para simular varios visitantes (útil para
 * medir energía con Green Metrics Tool, donde un solo visitante es demasiado poco).
 */
export async function runScenario(mode: Mode, profileViews = 20, attendees = 1): Promise<void> {
  const previous = getMode()
  setMode(mode)
  try {
    for (let a = 0; a < attendees; a++) {
      if (mode === 'zero-cloud') {
        await clearDatabase()
        const sync = await syncData()
        if (sync.status === 'error' || sync.status === 'offline') throw new Error('Initial sync failed.')
      }
      const list = await getCompanies()
      if (list.length === 0) throw new Error('The local server is not reachable.')
      for (let i = 0; i < profileViews; i++) await getCompany(list[i % list.length].id)
    }
  } finally {
    setMode(previous)
  }
}

/** Mismo escenario en los dos modos, en el mismo dispositivo (botón del dashboard). */
export async function runBenchmark(profileViews = 20): Promise<void> {
  resetMetrics()
  await runScenario('traditional', profileViews)
  await runScenario('zero-cloud', profileViews)
}
