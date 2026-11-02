import { useEffect, useState } from 'react'
import { FlaskConical, HardDrive, RefreshCw, RotateCcw, Trash2, Wifi, WifiOff } from 'lucide-react'
import { getAllCompanies, getMeta } from '../services/database'
import { getMetrics, resetMetrics, subscribeMetrics, type Bucket, type Metrics } from '../services/metrics'
import { onDataChange, resetDemo, syncData } from '../services/api'
import { runBenchmark } from '../services/benchmark'
import { estimateCO2, formatCO2 } from '../services/carbon'
import { setMode, useMode, type Mode } from '../services/settings'

const ATTENDEES = 1000
const PROFILE_VIEWS = 20

const kb = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`)
const avg = (total: number, count: number) => (count > 0 ? `${(total / count).toFixed(1)} ms` : '—')
const reduction = (trad: number, zero: number) =>
  trad > 0 ? `−${Math.round(((trad - zero) / trad) * 100)}%` : '—'

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return online
}

function ModeSwitch({ mode }: { mode: Mode }) {
  const options: { value: Mode; label: string }[] = [
    { value: 'zero-cloud', label: 'Zero-Cloud' },
    { value: 'traditional', label: 'Traditional (cloud-like)' },
  ]
  return (
    <div className="inline-flex rounded-xl border border-stone-200 bg-white p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => setMode(o.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            mode === o.value ? (o.value === 'traditional' ? 'bg-stone-700 text-white' : 'bg-green-700 text-white') : 'text-stone-600 hover:bg-stone-50'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Row({ label, trad, zero, diff }: { label: string; trad: string; zero: string; diff?: string }) {
  return (
    <tr className="border-t border-stone-100">
      <th scope="row" className="py-2 pr-3 text-left font-normal text-stone-600">
        {label}
      </th>
      <td className="py-2 pr-3 text-right tabular-nums">{trad}</td>
      <td className="py-2 pr-3 text-right font-medium tabular-nums">{zero}</td>
      <td className="py-2 text-right font-semibold text-green-700 tabular-nums">{diff ?? ''}</td>
    </tr>
  )
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 1 : 0) : 0
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-stone-600 tabular-nums">{kb(value)}</span>
      </div>
      <div className="h-3 rounded-full bg-stone-100">
        <div className={`h-3 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const online = useOnline()
  const mode = useMode()
  const [m, setM] = useState<Metrics>(getMetrics)
  const [stored, setStored] = useState({ companies: 0, jobs: 0, version: '—' })
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadStored = async () => {
    const companies = await getAllCompanies()
    const version = await getMeta<number>('version')
    setStored({
      companies: companies.length,
      jobs: companies.reduce((n, c) => n + c.jobs.length, 0),
      version: version !== undefined ? `v${version}` : '—',
    })
  }

  useEffect(() => {
    loadStored()
    const offData = onDataChange(loadStored)
    const offMetrics = subscribeMetrics(setM)
    return () => {
      offData()
      offMetrics()
    }
  }, [])

  const run = async (name: string, action: () => Promise<unknown>) => {
    setBusy(name)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      await loadStored()
      setBusy(null)
    }
  }

  const t: Bucket = m.traditional
  const z: Bucket = m['zero-cloud']
  const tCO2 = estimateCO2(t.bytes)
  const zCO2 = estimateCO2(z.bytes)
  const hasData = t.views > 0 || z.views > 0

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-stone-600">Real measurements on this device since the last reset.</p>
        </div>
        <ModeSwitch mode={mode} />
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Traditional vs. Zero-Cloud — same scenario</h2>
          <button
            disabled={busy !== null || !online}
            onClick={() => run('benchmark', () => runBenchmark(PROFILE_VIEWS))}
            className="flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
          >
            <FlaskConical size={16} className={busy === 'benchmark' ? 'animate-pulse' : ''} />
            {busy === 'benchmark' ? 'Running…' : `Run benchmark (1 list + ${PROFILE_VIEWS} profiles)`}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

        {hasData ? (
          <>
            <div className="mt-5 space-y-4">
              <Bar label="Traditional" value={t.bytes} max={Math.max(t.bytes, z.bytes)} color="bg-stone-500" />
              <Bar label="Zero-Cloud" value={z.bytes} max={Math.max(t.bytes, z.bytes)} color="bg-green-600" />
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="text-xs tracking-wide text-stone-500 uppercase">
                    <th className="pb-2 text-left font-medium">Metric</th>
                    <th className="pb-2 pr-3 text-right font-medium">Traditional</th>
                    <th className="pb-2 pr-3 text-right font-medium">Zero-Cloud</th>
                    <th className="pb-2 text-right font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  <Row label="Page views served" trad={String(t.views)} zero={String(z.views)} />
                  <Row label="Server requests" trad={String(t.requests)} zero={String(z.requests)} diff={reduction(t.requests, z.requests)} />
                  <Row label="Data transferred" trad={kb(t.bytes)} zero={kb(z.bytes)} diff={reduction(t.bytes, z.bytes)} />
                  <Row label="Avg. access time per view" trad={avg(t.viewMs, t.views)} zero={avg(z.viewMs, z.views)} />
                  <Row label="Views served offline" trad={String(t.offlineViews)} zero={String(z.offlineViews)} />
                  <Row label="Failed views" trad={String(t.failedViews)} zero={String(z.failedViews)} />
                  <Row label="Est. CO₂e (CO2.js)" trad={formatCO2(tCO2)} zero={formatCO2(zCO2)} diff={reduction(tCO2, zCO2)} />
                  <Row
                    label={`Projection: ${ATTENDEES.toLocaleString()} attendees`}
                    trad={`${kb(t.bytes * ATTENDEES)} · ${formatCO2(tCO2 * ATTENDEES)}`}
                    zero={`${kb(z.bytes * ATTENDEES)} · ${formatCO2(zCO2 * ATTENDEES)}`}
                  />
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-stone-500">
            No measurements yet. Run the benchmark, or browse the app in each mode with the switch above.
          </p>
        )}

        <p className="mt-4 text-xs text-stone-500">
          Requests, data and access times are measured in this browser (data payloads only; the app shell is cached by
          the Service Worker in both modes). CO₂e is an <strong>estimate</strong> from transferred bytes using CO2.js
          (Sustainable Web Design model v4, global grid average). The projection multiplies one visitor's scenario by{' '}
          {ATTENDEES.toLocaleString()}. Energy (Wh) is not measured here.
        </p>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            {online ? <Wifi size={18} className="text-green-700" /> : <WifiOff size={18} className="text-amber-700" />}
            Connection & sync
          </h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-stone-600">Status</dt>
              <dd className="font-medium">{online ? 'Online' : 'Offline'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-600">Last sync</dt>
              <dd className="font-medium">{m.lastSyncAt ? new Date(m.lastSyncAt).toLocaleTimeString() : '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-600">Result</dt>
              <dd className="text-right font-medium">{m.lastSyncResult ?? '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <HardDrive size={18} className="text-stone-600" />
            Stored on this device
          </h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-stone-600">Companies</dt>
              <dd className="font-medium">{stored.companies}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-600">Job offers</dt>
              <dd className="font-medium">{stored.jobs}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-600">Data version</dt>
              <dd className="font-medium">{stored.version}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          disabled={busy !== null || !online}
          onClick={() => run('sync', syncData)}
          className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={busy === 'sync' ? 'animate-spin' : ''} />
          Sync now
        </button>
        <button
          disabled={busy !== null}
          onClick={() => resetMetrics()}
          className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
        >
          <RotateCcw size={16} />
          Reset metrics
        </button>
        <button
          disabled={busy !== null}
          onClick={() => run('clear', resetDemo)}
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 size={16} />
          Clear local data
        </button>
      </div>
    </div>
  )
}
