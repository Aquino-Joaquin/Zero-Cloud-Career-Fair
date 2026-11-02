import { Link } from 'react-router-dom'
import { Briefcase, ChevronRight, MapPin } from 'lucide-react'
import type { Company } from '../types'

export function CompanyLogo({ company, size = 'md' }: { company: Company; size?: 'md' | 'lg' }) {
  const initials = company.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
  const dims = size === 'lg' ? 'size-16 text-xl' : 'size-12 text-base'
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl font-bold text-white ${dims}`}
      style={{ backgroundColor: company.color }}
      aria-hidden
    >
      {initials}
    </span>
  )
}

export default function CompanyCard({ company }: { company: Company }) {
  return (
    <Link
      to={`/company/${company.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-green-600 hover:shadow-sm"
    >
      <CompanyLogo company={company} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate font-semibold">{company.name}</h2>
          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[11px] font-medium text-stone-600">
            Booth {company.booth}
          </span>
        </div>
        <p className="truncate text-sm text-stone-600">{company.industry}</p>
        <div className="mt-1 flex gap-3 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {company.location}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase size={12} />
            {company.jobs.length} {company.jobs.length === 1 ? 'opening' : 'openings'}
          </span>
        </div>
      </div>
      <ChevronRight className="text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-green-700" size={20} />
    </Link>
  )
}
