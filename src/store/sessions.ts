import { useSyncExternalStore } from 'react'
import { getFavorites, importFavorites } from './favorites'
import { getHistory, importHistory } from './history'
import { syncMilestones } from './milestones'
import { EXERCISE_MAP } from '../data/exercises'
import { STARTERS } from '../data/templates'
import { t } from '../i18n'
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

const num = (v: unknown, { min, max }: { min: number; max: number }, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback

/** A trimmed, length-clamped note as an optional field (empty or non-string notes are dropped). */
const cleanNote = (v: unknown): { note?: string } => {
  const note = typeof v === 'string' ? v.trim().slice(0, MAX_NOTE_LENGTH) : ''
  return note ? { note } : {}
}

/**
 * A session item clamped to the editor's ranges, or undefined when its exercise is not in the library.
 * Used for imports and for stored sessions alike, so an item whose exercise no longer exists (or a corrupt
 * value) cannot leave an invisible, unremovable row in the editor or a progress segment that never fills.
 */
function cleanItem(i: Partial<SessionItem> | null | undefined, id: string): SessionItem | undefined {
  const ex = i && typeof i.exerciseId === 'string' ? EXERCISE_MAP.get(i.exerciseId) : undefined
  if (!i || !ex) return undefined
  return {
    id,
    exerciseId: ex.id,
    value: num(i.value, LIMITS[ex.mode], ex.defaultValue),
    sets: num(i.sets, LIMITS.sets, 1),
    // null/undefined = no override (follow the session's transition rest).
    ...(i.restAfterSec == null ? {} : { restAfterSec: num(i.restAfterSec, LIMITS.rest, 0) }),
    ...(i.gear && EQUIPMENT.includes(i.gear) && ex.gearOptions?.[i.gear] ? { gear: i.gear } : {}),
    ...cleanNote(i.note),
  }
}

const cleanItems = (items: unknown[], keepIds: boolean): SessionItem[] =>
  items.flatMap((i) => {
    const id = keepIds && typeof (i as SessionItem)?.id === 'string' && (i as SessionItem).id ? (i as SessionItem).id! : newId()
    return cleanItem(i as SessionItem, id) ?? []
  })

function read(): Session[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    if (data?.version !== VERSION || !Array.isArray(data.sessions)) return []
    return (data.sessions as unknown[]).filter(isSession).map((s) => ({
      ...s,
      items: cleanItems(s.items, true),
      defaultSetRestSec: num(s.defaultSetRestSec, LIMITS.rest, 30),
      defaultTransitionSec: num(s.defaultTransitionSec, LIMITS.rest, 10),
    }))
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
/** Adds a new session (empty unless `init` gives its items/rests) and returns it. */
export function createSession(name = t('sessions.newName'), init: Partial<Omit<Session, 'id' | 'name'>> = {}): Session {
  const s: Session = { id: newId(), name, items: [], defaultSetRestSec: 30, defaultTransitionSec: 10, ...init }
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
  const copy: Session = { ...src, id: newId(), name: name ?? `${src.name} ${t('sessions.copySuffix')}`, items: src.items.map((i) => ({ ...i, id: newId() })) }
  commit([...sessions, copy])
  return copy
}

/** Backup file: sessions plus favourites and history, so moving to another device or domain keeps everything. */
export const exportJson = () => JSON.stringify({ version: VERSION, sessions, favorites: getFavorites(), history: getHistory() }, null, 2)

/** Imports a backup from JSON text. Returns how many sessions and history entries were added, or throws on invalid input. */
export function importJson(text: string): { sessions: number; history: number } {
  const data = JSON.parse(text)
  if (!data || !Array.isArray(data.sessions)) throw new Error('Not a workout export file')
  const added: Session[] = []
  for (const raw of data.sessions) {
    if (!raw || typeof raw.name !== 'string' || !Array.isArray(raw.items)) continue
    added.push({
      id: newId(),
      // A blank name would leave an unlabeled row (and "Start " buttons) in the sessions list, as in the editor.
      name: raw.name.trim().slice(0, MAX_NAME_LENGTH) || t('sessions.newName'),
      items: cleanItems(raw.items, false),
      defaultSetRestSec: num(raw.defaultSetRestSec, LIMITS.rest, 30),
      defaultTransitionSec: num(raw.defaultTransitionSec, LIMITS.rest, 10),
    })
  }
  commit([...sessions, ...added])
  if (data.favorites !== undefined) importFavorites(data.favorites)
  const history = importHistory(data.history)
  // Imported history can satisfy milestones (e.g. "10 sessions"); unlock them now rather than after the next workout.
  if (history) syncMilestones()
  return { sessions: added.length, history }
}
