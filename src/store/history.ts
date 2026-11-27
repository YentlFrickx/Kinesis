import { useSyncExternalStore } from 'react'
import { CATEGORIES, EQUIPMENT, type Category, type Equipment } from '../data/types'
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

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** A stored workout item with its optional note/gear kept only when well-formed (a non-string note was printed as-is by Copy). */
function cleanItem(i: unknown): WorkoutItem | undefined {
  if (!isObject(i) || typeof i.exerciseId !== 'string' || !Number.isFinite(i.value) || !Number.isFinite(i.sets)) return undefined
  const { exerciseId, value, sets, note, gear } = i as unknown as WorkoutItem
  return {
    exerciseId, value, sets,
    ...(EQUIPMENT.includes(gear as Equipment) ? { gear } : {}),
    ...(typeof note === 'string' && note ? { note } : {}),
  }
}

/**
 * A stored entry with its optional fields sanitised, or undefined when it is malformed (hand-edited or corrupted
 * storage). The screens rely on these shapes: a non-array `items` used to break the Exercises tab ("recent" filter)
 * and the Copy button, and a string category count turned the weekly balance into string concatenation.
 */
function cleanEntry(e: unknown): HistoryEntry | undefined {
  if (!isObject(e) || typeof e.id !== 'string' || typeof e.sessionId !== 'string' || typeof e.sessionName !== 'string') return undefined
  if (!Number.isFinite(e.completedAt) || !Number.isFinite(e.durationSec)) return undefined
  const { categories, items, ...rest } = e as unknown as HistoryEntry
  const counts = isObject(categories)
    ? Object.fromEntries(CATEGORIES.flatMap((c) => (Number.isFinite(categories[c]) ? [[c, categories[c]]] : [])))
    : undefined
  return {
    ...rest,
    ...(counts ? { categories: counts } : {}),
    ...(Array.isArray(items) ? { items: items.flatMap((i) => cleanItem(i) ?? []) } : {}),
  }
}

function read(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return data?.version === VERSION && Array.isArray(data.entries) ? data.entries.flatMap((e: unknown) => cleanEntry(e) ?? []) : []
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
