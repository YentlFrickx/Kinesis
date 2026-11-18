import { useSyncExternalStore } from 'react'
import { earnedMilestones } from '../lib/progress'
import { getGoal } from './goal'
import { getHistory } from './history'

const KEY = 'rw.milestones.v1'

/** Unlocked milestone id -> epoch ms. Stored so a milestone is never lost (e.g. when the goal changes or history is cleared). */
function read(): Record<string, number> {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  } catch {
    return {}
  }
}

let unlocked = read()
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useUnlocked = () => useSyncExternalStore(subscribe, () => unlocked)

/** Unlocks any milestones the current history satisfies. Returns the ids that are newly unlocked. */
export function syncMilestones(): string[] {
  const fresh = earnedMilestones(getHistory(), getGoal()).filter((id) => !(id in unlocked))
  if (fresh.length) {
    const now = Date.now()
    unlocked = { ...unlocked, ...Object.fromEntries(fresh.map((id) => [id, now])) }
    try {
      localStorage.setItem(KEY, JSON.stringify(unlocked))
    } catch {
      /* storage unavailable: keep in-memory state */
    }
    listeners.forEach((l) => l())
  }
  return fresh
}

// Backfill for people who already have history.
syncMilestones()
