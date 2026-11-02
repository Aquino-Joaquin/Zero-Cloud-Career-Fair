import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { runScenario } from './services/benchmark'
import { getMetrics, resetMetrics } from './services/metrics'
import './index.css'

// Hook para mediciones automáticas (Playwright / Green Metrics Tool).
declare global {
  interface Window {
    zeroCloud: { runScenario: typeof runScenario; getMetrics: typeof getMetrics; resetMetrics: typeof resetMetrics }
  }
}
window.zeroCloud = { runScenario, getMetrics, resetMetrics }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
