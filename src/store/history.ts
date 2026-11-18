import { useSyncExternalStore } from 'react'
import type { Category } from '../data/types'
import type { WorkoutItem } from '../lib/workoutText'

export interface HistoryEntry {
  id: string
  sessionId: string
  /** Name at the time of completion (the session may later be renamed or deleted). */
  sessionName: string
  /** Epoch ms when the session was completed. */
  completedAt: number
  /** Time actually spent exercising (excluding pauses), in seconds. */
  durationSec: number
  /** Number of exercises done per category. Absent on entries recorded before this was tracked. */
  categories?: Partial<Record<Category, number>>
  /** The exercises done (sets/reps/notes at the time). Absent on older entries. */
  items?: WorkoutItem[]
}

const KEY = 'rw.history.v1'
const VERSION = 1
const MAX_ENTRIES = 500

function read(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return data?.version === VERSION && Array.isArray(data.entries) ? data.entries : []
  } catch {
    return []
  }
}

let entries: HistoryEntry[] = read()
const listeners = new Set<() => void>()

function commit(next: HistoryEntry[]) {
  entries = next
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, entries }))
  } catch {
    /* storage unavailable: keep in-memory state */
  }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const getHistory = () => entries

/** Completed sessions, newest first. */
export const useHistory = () => useSyncExternalStore(subscribe, () => entries)

export function recordCompletion(sessionId: string, sessionName: string, durationSec: number, categories?: HistoryEntry['categories'], items?: WorkoutItem[]): HistoryEntry {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    sessionId,
    sessionName,
    completedAt: Date.now(),
    durationSec: Math.max(0, Math.round(durationSec)),
    ...(categories ? { categories } : {}),
    ...(items ? { items } : {}),
  }
  commit([entry, ...entries].slice(0, MAX_ENTRIES))
  return entry
}

export const deleteEntry = (id: string) => commit(entries.filter((e) => e.id !== id))
export const clearHistory = () => commit([])

/** Replaces the whole history (used by undo). */
export const restoreHistory = (list: HistoryEntry[]) => commit(list)
