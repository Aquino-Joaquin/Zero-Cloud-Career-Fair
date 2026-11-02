import { co2 } from '@tgwf/co2'

/*
 * CO2.js (The Green Web Foundation), modelo Sustainable Web Design v4.
 * Es una ESTIMACIÓN a partir de los bytes transferidos (red, centro de datos
 * y dispositivo), no una medición de energía.
 */
const swd = new co2({ model: 'swd', version: 4 })

/** Gramos de CO₂e estimados para transferir `bytes` (red eléctrica no verde). */
export function estimateCO2(bytes: number): number {
  return bytes > 0 ? Number(swd.perByte(bytes, false)) : 0
}

export function formatCO2(grams: number): string {
  if (grams === 0) return '0 g'
  if (grams < 0.001) return `${(grams * 1_000_000).toFixed(1)} µg`
  if (grams < 1) return `${(grams * 1000).toFixed(2)} mg`
  return `${grams.toFixed(2)} g`
}
