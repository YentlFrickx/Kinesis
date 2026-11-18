import { vi } from 'vitest'

/** Installs an in-memory localStorage and re-imports a store module fresh (stores read storage at import time). */
export function installStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
  })
  vi.resetModules()
  return data
}
