import { useSyncExternalStore } from 'react'
import { getFavorites, importFavorites } from './favorites'
import { EXERCISE_MAP } from '../data/exercises'
import { STARTERS } from '../data/templates'
import { EQUIPMENT, LIMITS, MAX_NAME_LENGTH, MAX_NOTE_LENGTH, type Session, type SessionItem } from '../data/types'

const KEY = 'rw.sessions.v1'
const VERSION = 1

const newId = () => crypto.randomUUID()

/** Gives every item a stable id (existing ids are kept); returns the same objects when nothing changed. */
function withItemIds(list: Session[]): Session[] {
  return list.map((s) => (s.items.every((i) => i.id) ? s : { ...s, items: s.items.map((i) => (i.id ? i : { ...i, id: newId() })) }))
}

/** Drops malformed sessions (hand-edited or corrupted storage) so one bad entry cannot wipe the whole list. */
const isSession = (s: unknown): s is Session =>
  !!s && typeof s === 'object' && typeof (s as Session).id === 'string' && typeof (s as Session).name === 'string' &&
  Array.isArray((s as Session).items) && (s as Session).items.every((i) => !!i && typeof i === 'object')

function read(): Session[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return data?.version === VERSION && Array.isArray(data.sessions) ? withItemIds(data.sessions.filter(isSession)) : []
  } catch {
    return []
  }
}

const SEEDED_KEY = 'rw.seeded.v1'

let sessions: Session[] = read()
const listeners = new Set<() => void>()

function commit(next: Session[]) {
  sessions = withItemIds(next)
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, sessions }))
  } catch {
    /* storage unavailable: keep in-memory state */
  }
  listeners.forEach((l) => l())
}

const cloneStarter = (s: Session): Session => ({ ...s, items: s.items.map((i) => ({ ...i })) })

/** Starter sessions that are not currently in the list (e.g. deleted by the user). */
export const missingStarters = (list: Session[] = sessions) => STARTERS.filter((s) => !list.some((x) => x.id === s.id))

/** Re-adds any missing starter sessions. Returns how many were added. */
export function restoreStarters(): number {
  const missing = missingStarters()
  if (missing.length) commit([...sessions, ...missing.map(cloneStarter)])
  return missing.length
}

// Add the starter sessions once, on first launch (also for users who already had sessions).
try {
  if (localStorage.getItem(SEEDED_KEY) !== '1') {
    sessions = [...sessions, ...missingStarters().map(cloneStarter)]
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, sessions }))
    localStorage.setItem(SEEDED_KEY, '1')
  }
} catch {
  /* storage unavailable: no seeding */
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useSessions = () => useSyncExternalStore(subscribe, () => sessions)
export const getSession = (id: string) => sessions.find((s) => s.id === id)
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

/** Puts a previously deleted session back at `index` (used by undo). No-op if it already exists. */
export function restoreSession(session: Session, index = sessions.length) {
  if (sessions.some((s) => s.id === session.id)) return
  const next = [...sessions]
  next.splice(Math.min(index, next.length), 0, session)
  commit(next)
}

export const sessionIndex = (id: string) => sessions.findIndex((s) => s.id === id)

export function duplicateSession(id: string, name?: string): Session | undefined {
  const src = getSession(id)
  if (!src) return
  const copy: Session = { ...src, id: newId(), name: name ?? `${src.name} (copy)`, items: src.items.map((i) => ({ ...i, id: newId() })) }
  commit([...sessions, copy])
  return copy
}

export const exportJson = () => JSON.stringify({ version: VERSION, sessions, favorites: getFavorites() }, null, 2)

const num = (v: unknown, { min, max }: { min: number; max: number }, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback

/** A trimmed, length-clamped note as an optional field (empty or non-string notes are dropped). */
const cleanNote = (v: unknown): { note?: string } => {
  const note = typeof v === 'string' ? v.trim().slice(0, MAX_NOTE_LENGTH) : ''
  return note ? { note } : {}
}

/** Imports sessions from JSON text. Returns the number added, or throws on invalid input. */
export function importJson(text: string): number {
  const data = JSON.parse(text)
  if (!data || !Array.isArray(data.sessions)) throw new Error('Not a workout export file')
  const added: Session[] = []
  for (const raw of data.sessions) {
    if (!raw || typeof raw.name !== 'string' || !Array.isArray(raw.items)) continue
    const items: SessionItem[] = raw.items
      .filter((i: SessionItem) => EXERCISE_MAP.has(i?.exerciseId))
      .map((i: SessionItem) => {
        const ex = EXERCISE_MAP.get(i.exerciseId)!
        return {
          id: newId(),
          exerciseId: i.exerciseId,
          value: num(i.value, LIMITS[ex.mode], ex.defaultValue),
          sets: num(i.sets, LIMITS.sets, 1),
          // null/undefined = no override (follow the session's transition rest).
          ...(i.restAfterSec == null ? {} : { restAfterSec: num(i.restAfterSec, LIMITS.rest, 0) }),
          ...(EQUIPMENT.includes(i.gear!) && ex.gearOptions?.[i.gear!] ? { gear: i.gear } : {}),
          ...cleanNote(i.note),
        }
      })
    added.push({
      id: newId(),
      name: raw.name.trim().slice(0, MAX_NAME_LENGTH),
      items,
      defaultSetRestSec: num(raw.defaultSetRestSec, LIMITS.rest, 30),
      defaultTransitionSec: num(raw.defaultTransitionSec, LIMITS.rest, 10),
    })
  }
  commit([...sessions, ...added])
  if (data.favorites !== undefined) importFavorites(data.favorites)
  return added.length
}
