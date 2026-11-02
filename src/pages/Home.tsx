import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import CompanyCard from '../components/CompanyCard'
import { getCompanies, onDataChange, syncData } from '../services/api'
import { getMode } from '../services/settings'
import type { Company } from '../types'

export default function Home() {
  const [companies, setCompanies] = useState<Company[] | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      let list = await getCompanies()
      // Primera visita: aún no hay nada en IndexedDB, esperar a la descarga inicial.
      if (list.length === 0 && getMode() === 'zero-cloud') {
        await syncData()
        list = await getCompanies()
      }
      setCompanies(list)
    }
    load()
    return onDataChange(() => getCompanies().then(setCompanies))
  }, [])

  const filtered = useMemo(() => {
    if (!companies) return []
    const q = query.trim().toLowerCase()
    if (!q) return companies
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.jobs.some((j) => j.title.toLowerCase().includes(q)),
    )
  }, [companies, query])

  const totalJobs = companies?.reduce((n, c) => n + c.jobs.length, 0) ?? 0

  return (
    <div>
      <section className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Companies at the fair</h1>
        <p className="mt-1 text-stone-600">
          {companies ? `${companies.length} companies · ${totalJobs} open positions` : 'Loading…'}
        </p>
      </section>

      <label className="relative mb-4 block">
        <Search size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search companies, industries or roles"
          className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pr-3 pl-10 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((c) => (
          <CompanyCard key={c.id} company={c} />
        ))}
      </div>

      {companies && companies.length === 0 && (
        <div className="py-10 text-center text-stone-500">
          <p>
            {getMode() === 'traditional'
              ? 'Traditional mode: could not load data from the server.'
              : 'No company data on this device yet. Connect to the fair network to download it.'}
          </p>
          {getMode() === 'zero-cloud' && <button
            onClick={async () => {
              const result = await syncData()
              if (result.status === 'error') alert(`Could not reach the local server (${result.message}).`)
              setCompanies(await getCompanies())
            }}
            className="mt-4 rounded-xl bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Download company data
          </button>}
        </div>
      )}

      {companies && companies.length > 0 && filtered.length === 0 && (
        <p className="py-10 text-center text-stone-500">No companies match “{query}”.</p>
      )}
    </div>
  )
}
