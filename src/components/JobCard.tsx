import { useState } from 'react'
import { ChevronDown, MapPin } from 'lucide-react'
import type { Job } from '../types'

const typeStyles: Record<Job['type'], string> = {
  'Full-time': 'bg-green-100 text-green-800',
  'Part-time': 'bg-sky-100 text-sky-800',
  Internship: 'bg-violet-100 text-violet-800',
}

export default function JobCard({ job }: { job: Job }) {
  const [open, setOpen] = useState(false)

  return (
    <article className="rounded-2xl border border-stone-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{job.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-medium ${typeStyles[job.type]}`}>{job.type}</span>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 font-medium text-stone-700">{job.modality}</span>
            <span className="flex items-center gap-1 text-stone-500">
              <MapPin size={12} />
              {job.location}
            </span>
          </div>
        </div>
        <ChevronDown size={20} className={`mt-0.5 shrink-0 text-stone-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-stone-100 px-4 pt-3 pb-4 text-sm">
          <p className="text-stone-700">{job.description}</p>
          <h4 className="mt-3 text-xs font-semibold tracking-wide text-stone-500 uppercase">Requirements</h4>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-stone-700">
            {job.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
