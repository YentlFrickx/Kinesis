import { useSyncExternalStore } from 'react'
import type { Session } from '../data/types'
import { go } from '../lib/router'

const KEY = 'rw.run.v1'
const VERSION = 1
/** A saved run older than this is considered abandoned. */
export const MAX_AGE_MS = 12 * 60 * 60 * 1000

export interface SavedRun {
  sessionId: string
  /** Fingerprint of the session at save time; a mismatch means it was edited since. */
  signature: string
  index: number
  /** Remaining time of the current step; Infinity (manual rep step) is stored as null. */
  remainingMs: number | null
  activeMs: number
  savedAt: number
}

/** Fingerprint of everything that influences the generated steps. */
export const sessionSignature = (s: Session): string =>
  JSON.stringify([s.items.map((i) => [i.exerciseId, i.value, i.sets, i.restAfterSec ?? null, i.gear ?? null]), s.defaultSetRestSec, s.defaultTransitionSec])

/**
 * Returns the run if it can still be resumed against `session` with `stepCount` steps, else undefined.
 * Rejects: wrong/missing session, edited session, stale or future timestamps, out-of-range or malformed fields.
 */
export function validateRun(run: unknown, session: Session | undefined, stepCount: number, now = Date.now()): SavedRun | undefined {
  if (!run || typeof run !== 'object' || !session || stepCount <= 0) return undefined
  const r = run as SavedRun
  const fin = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)
  if (r.sessionId !== session.id || r.signature !== sessionSignature(session)) return undefined
  if (!fin(r.index) || !Number.isInteger(r.index) || r.index < 0 || r.index >= stepCount) return undefined
  if (r.remainingMs !== null && (!fin(r.remainingMs) || r.remainingMs < 0)) return undefined
  if (!fin(r.activeMs) || r.activeMs < 0) return undefined
  if (!fin(r.savedAt) || r.savedAt > now + 60_000 || now - r.savedAt > MAX_AGE_MS) return undefined
  return r
}

function read(): SavedRun | undefined {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return undefined
    const data = JSON.parse(raw)
    return data?.version === VERSION && data.run && typeof data.run === 'object' ? data.run : undefined
  } catch {
    return undefined
  }
}

let saved = read()
const listeners = new Set<() => void>()

function write(next: SavedRun | undefined) {
  saved = next
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify({ version: VERSION, run: next }))
    else localStorage.removeItem(KEY)
  } catch {
    /* storage unavailable: keep in-memory state */
  }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const getSavedRun = () => saved
export const useSavedRun = () => useSyncExternalStore(subscribe, () => saved)
export const saveRun = (run: SavedRun) => write(run)
export const clearRun = () => { if (saved) write(undefined) }

/** Starts a session from the beginning, discarding any saved run (opening `#/play/:id` itself resumes a valid one). */
export function startSession(id: string) {
  clearRun()
  go(`/play/${id}`)
}
