import { useEffect, useState } from 'react'
import { AlertTriangle, Printer } from 'lucide-react'
import QRCode, { companyUrl } from '../components/QRCode'
import { CompanyLogo } from '../components/CompanyCard'
import { getCompanies } from '../services/api'
import type { Company } from '../types'

const STORAGE_KEY = 'zc-qr-base-url'

function initialBaseUrl() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return saved
  } catch {
    /* sin almacenamiento: usar valor por defecto */
  }
  const { hostname, origin } = window.location
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'
  const port = window.location.port ? `:${window.location.port}` : ''
  return isLocal ? `${window.location.protocol}//${__LAN_HOST__}${port}` : origin
}

export default function QrCodes() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl)

  useEffect(() => {
    getCompanies().then(setCompanies)
  }, [])

  const updateBaseUrl = (value: string) => {
    setBaseUrl(value)
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      /* ignorar */
    }
  }

  const pointsToLocalhost = /localhost|127\.0\.0\.1/.test(baseUrl)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Booth QR codes</h1>
          <p className="mt-1 text-stone-600">Scan a code to open the company profile on your phone.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2 font-medium text-white hover:bg-green-800"
        >
          <Printer size={18} />
          Print
        </button>
      </div>

      <label className="mb-2 block text-sm font-medium text-stone-700 print:hidden">
        Server address encoded in the QR codes
        <input
          value={baseUrl}
          onChange={(e) => updateBaseUrl(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20"
        />
      </label>
      {pointsToLocalhost && (
        <p className="mb-4 flex items-center gap-2 text-sm text-amber-700 print:hidden">
          <AlertTriangle size={16} />
          Phones can't reach “localhost”. Use this computer's local IP (e.g. http://192.168.1.20:5173).
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
        {companies.map((c) => (
          <article
            key={c.id}
            className="flex flex-col items-center rounded-2xl border border-stone-200 bg-white p-5 text-center break-inside-avoid"
          >
            <div className="mb-3 flex items-center gap-3">
              <CompanyLogo company={c} />
              <div className="text-left">
                <h2 className="font-semibold">{c.name}</h2>
                <p className="text-sm text-stone-600">Booth {c.booth}</p>
              </div>
            </div>
            <QRCode company={c} baseUrl={baseUrl} />
            <p className="mt-2 font-mono text-[11px] break-all text-stone-500">{companyUrl(baseUrl, c)}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
