import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, MapPin, Store } from 'lucide-react'
import { CompanyLogo } from '../components/CompanyCard'
import JobCard from '../components/JobCard'
import { getCompany, onDataChange, syncData } from '../services/api'
import { getMode } from '../services/settings'
import type { Company } from '../types'

export default function CompanyDetail() {
  const { id = '' } = useParams()
  const [company, setCompany] = useState<Company | null | undefined>(undefined)

  useEffect(() => {
    const load = async () => {
      let c = await getCompany(id)
      // Llegada desde un QR sin datos locales: descargar y volver a intentar.
      if (!c && getMode() === 'zero-cloud') {
        await syncData()
        c = await getCompany(id)
      }
      setCompany(c ?? null)
    }
    load()
    return onDataChange(() => getCompany(id).then((c) => setCompany(c ?? null)))
  }, [id])

  if (company === undefined) return <p className="text-stone-500">Loading…</p>

  if (company === null) {
    return (
      <div className="py-10 text-center">
        <p className="text-stone-600">
          {getMode() === 'traditional'
            ? 'Traditional mode: could not load this company from the server.'
            : navigator.onLine
            ? 'Company not found.'
            : 'This company is not saved on your device yet. Connect to the fair network to download it.'}
        </p>
        <Link to="/" className="mt-3 inline-block font-medium text-green-700">
          Back to all companies
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-green-700">
        <ArrowLeft size={16} />
        All companies
      </Link>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-center gap-4">
          <CompanyLogo company={company} size="lg" />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
            <p className="text-stone-600">{company.industry}</p>
          </div>
        </div>

        <p className="mt-4 text-stone-700">{company.description}</p>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-600">
          <span className="flex items-center gap-1.5">
            <Store size={16} />
            Booth {company.booth}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={16} />
            {company.location}
          </span>
          <a
            href={company.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 font-medium text-green-700 hover:underline"
          >
            <ExternalLink size={16} />
            Website
          </a>
        </div>
      </section>

      <h2 className="mt-8 mb-3 text-lg font-semibold">
        Open positions <span className="text-stone-500">({company.jobs.length})</span>
      </h2>
      <div className="space-y-3">
        {company.jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  )
}
