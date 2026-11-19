import { useSyncExternalStore } from 'react'
import { EXERCISE_MAP } from '../data/exercises'

const KEY = 'rw.favorites.v1'
const VERSION = 1

const clean = (v: unknown): string[] =>
  Array.isArray(v) ? [...new Set(v.filter((id): id is string => typeof id === 'string' && EXERCISE_MAP.has(id)))] : []

function read(): string[] {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    return data?.version === VERSION ? clean(data.ids) : []
  } catch {
    return []
  }
}

let ids: string[] = read()
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

function commit(next: string[]) {
  ids = next
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, ids }))
  } catch {
    /* storage unavailable: keep in-memory state */
  }
  listeners.forEach((l) => l())
}

export const getFavorites = () => ids
export const useFavorites = () => useSyncExternalStore(subscribe, () => ids)
export const toggleFavorite = (id: string) => commit(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])
/** Merges favourites from a backup file (unknown ids are dropped). */
export const importFavorites = (raw: unknown) => commit(clean([...ids, ...clean(raw)]))
