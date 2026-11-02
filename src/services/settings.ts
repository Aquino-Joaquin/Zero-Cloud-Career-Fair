import { useEffect, useState } from 'react'

/**
 * zero-cloud:  los datos se leen de IndexedDB; la red solo se usa para sincronizar.
 * traditional: cada vista pide los datos al servidor, como una plataforma en la nube.
 */
export type Mode = 'zero-cloud' | 'traditional'

const KEY = 'zc-mode'
const listeners = new Set<(m: Mode) => void>()

let mode: Mode = (() => {
  try {
    return localStorage.getItem(KEY) === 'traditional' ? 'traditional' : 'zero-cloud'
  } catch {
    return 'zero-cloud'
  }
})()

export function getMode(): Mode {
  return mode
}

export function setMode(next: Mode) {
  mode = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* ignorar */
  }
  listeners.forEach((l) => l(next))
}

export function useMode(): Mode {
  const [value, setValue] = useState(mode)
  useEffect(() => {
    listeners.add(setValue)
    return () => {
      listeners.delete(setValue)
    }
  }, [])
  return value
}
