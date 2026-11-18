import { useSyncExternalStore } from 'react'

const KEY = 'rw.goal.v1'
export const DEFAULT_GOAL = 3
export const MAX_GOAL = 7

const clamp = (n: number) => Math.min(MAX_GOAL, Math.max(1, Math.round(n)))

function read(): number {
  try {
    const n = Number(JSON.parse(localStorage.getItem(KEY) ?? 'null')?.weekly)
    return Number.isFinite(n) ? clamp(n) : DEFAULT_GOAL
  } catch {
    return DEFAULT_GOAL
  }
}

let weekly = read()
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const getGoal = () => weekly
export const useGoal = () => useSyncExternalStore(subscribe, () => weekly)

export function setGoal(n: number) {
  weekly = clamp(n)
  try {
    localStorage.setItem(KEY, JSON.stringify({ weekly }))
  } catch {
    /* storage unavailable: keep in-memory state */
  }
  listeners.forEach((l) => l())
}
