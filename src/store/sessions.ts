import { useSyncExternalStore } from 'react'
import { EXERCISE_MAP } from '../data/exercises'
import type { Session, SessionItem } from '../data/types'

const KEY = 'rw.sessions.v1'
const VERSION = 1

function read(): Session[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return data?.version === VERSION && Array.isArray(data.sessions) ? data.sessions : []
  } catch {
    return []
  }
}

let sessions: Session[] = read()
const listeners = new Set<() => void>()

function commit(next: Session[]) {
  sessions = next
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, sessions }))
  } catch {
    /* storage unavailable: keep in-memory state */
  }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useSessions = () => useSyncExternalStore(subscribe, () => sessions)
export const getSession = (id: string) => sessions.find((s) => s.id === id)
const newId = () => crypto.randomUUID()

export function createSession(name = 'New session'): Session {
  const s: Session = { id: newId(), name, items: [], defaultSetRestSec: 30, defaultTransitionSec: 10 }
  commit([...sessions, s])
  return s
}

export function updateSession(id: string, patch: (s: Session) => Session) {
  commit(sessions.map((s) => (s.id === id ? patch(s) : s)))
}

export function deleteSession(id: string) {
  commit(sessions.filter((s) => s.id !== id))
}

export function duplicateSession(id: string): Session | undefined {
  const src = getSession(id)
  if (!src) return
  const copy: Session = { ...src, id: newId(), name: `${src.name} (copy)`, items: src.items.map((i) => ({ ...i })) }
  commit([...sessions, copy])
  return copy
}

export const exportJson = () => JSON.stringify({ version: VERSION, sessions }, null, 2)

const num = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback

/** Imports sessions from JSON text. Returns the number added, or throws on invalid input. */
export function importJson(text: string): number {
  const data = JSON.parse(text)
  if (!data || !Array.isArray(data.sessions)) throw new Error('Not a workout export file')
  const added: Session[] = []
  for (const raw of data.sessions) {
    if (!raw || typeof raw.name !== 'string' || !Array.isArray(raw.items)) continue
    const items: SessionItem[] = raw.items
      .filter((i: SessionItem) => EXERCISE_MAP.has(i?.exerciseId))
      .map((i: SessionItem) => ({
        exerciseId: i.exerciseId,
        value: num(i.value, 1, 3600, 30),
        sets: num(i.sets, 1, 20, 1),
        ...(i.restAfterSec === undefined ? {} : { restAfterSec: num(i.restAfterSec, 0, 600, 0) }),
      }))
    added.push({
      id: newId(),
      name: raw.name.slice(0, 80),
      items,
      defaultSetRestSec: num(raw.defaultSetRestSec, 0, 600, 30),
      defaultTransitionSec: num(raw.defaultTransitionSec, 0, 600, 10),
    })
  }
  commit([...sessions, ...added])
  return added.length
}
