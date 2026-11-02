import { useEffect, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { BarChart3, Leaf, QrCode, Wifi, WifiOff } from 'lucide-react'
import Home from './pages/Home'
import CompanyDetail from './pages/CompanyDetail'
import QrCodes from './pages/QrCodes'
import Dashboard from './pages/Dashboard'
import { syncData } from './services/api'
import { useMode } from './services/settings'

function useOnlineStatus() {
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

export default function App() {
  const online = useOnlineStatus()
  const mode = useMode()

  // Zero-Cloud: sincroniza al abrir la app y cada vez que vuelve la conexión.
  useEffect(() => {
    if (online && mode === 'zero-cloud') syncData()
  }, [online, mode])

  return (
    <div className="min-h-dvh">
      <header className="print:hidden sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-green-700 text-white">
              <Leaf size={18} />
            </span>
            Zero-Cloud Career Fair
          </Link>
          <div className="flex items-center gap-2">
          {mode === 'traditional' && (
            <Link to="/dashboard" className="rounded-full bg-stone-700 px-2.5 py-1 text-xs font-medium text-white">
              Traditional mode
            </Link>
          )}
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100"
          >
            <BarChart3 size={14} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link
            to="/qr"
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100"
          >
            <QrCode size={14} />
            <span className="hidden sm:inline">QR codes</span>
          </Link>
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              online ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {online ? <Wifi size={14} /> : <WifiOff size={14} />}
            {online ? 'Online' : 'Offline'}
          </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/company/:id" element={<CompanyDetail />} />
          <Route path="/qr" element={<QrCodes />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  )
}
