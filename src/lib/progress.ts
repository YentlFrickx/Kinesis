import { STARTERS } from '../data/templates'
import type { HistoryEntry } from '../store/history'

const DAY_MS = 86_400_000

/** Local midnight of the day containing `t`. */
export function startOfDay(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Local midnight of the Monday of the week containing `t`. */
export function startOfWeek(t: number): number {
  const d = new Date(startOfDay(t))
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
}

const addDays = (t: number, n: number) => {
  const d = new Date(t)
  d.setDate(d.getDate() + n)
  return d.getTime()
}

/** Sessions completed in the calendar week (Mon–Sun) that contains `now`. */
export function sessionsThisWeek(entries: HistoryEntry[], now: number): number {
  const from = startOfWeek(now)
  const to = addDays(from, 7)
  return entries.filter((e) => e.completedAt >= from && e.completedAt < to).length
}

export interface HeatDay {
  /** Local midnight. */
  day: number
  count: number
  future: boolean
}

/** The last `weeks` calendar weeks (oldest first, Monday-first columns), ending with the current week. */
export function heatmap(entries: HistoryEntry[], now: number, weeks = 12): HeatDay[][] {
  const counts = new Map<number, number>()
  for (const e of entries) {
    const d = startOfDay(e.completedAt)
    counts.set(d, (counts.get(d) ?? 0) + 1)
  }
  const today = startOfDay(now)
  const first = addDays(startOfWeek(now), -7 * (weeks - 1))
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = addDays(first, w * 7 + d)
      return { day, count: counts.get(day) ?? 0, future: day > today }
    }),
  )
}

export interface Milestone {
  id: string
  emoji: string
  title: string
  description: string
}

export const MILESTONES: Milestone[] = [
  { id: 'first-session', emoji: '🌱', title: 'First session', description: 'Complete your first session.' },
  { id: 'sessions-10', emoji: '🔟', title: '10 sessions', description: 'Complete 10 sessions.' },
  { id: 'sessions-50', emoji: '🏅', title: '50 sessions', description: 'Complete 50 sessions.' },
  { id: 'goal-week', emoji: '🎯', title: 'Goal reached', description: 'Hit your weekly goal for the first time.' },
  { id: 'all-starters', emoji: '🧭', title: 'Tried every starter', description: 'Complete each starter session at least once.' },
]

/** Ids of the milestones that the given history satisfies. */
export function earnedMilestones(entries: HistoryEntry[], goal: number): string[] {
  const earned: string[] = []
  if (entries.length >= 1) earned.push('first-session')
  if (entries.length >= 10) earned.push('sessions-10')
  if (entries.length >= 50) earned.push('sessions-50')

  const perWeek = new Map<number, number>()
  for (const e of entries) {
    const w = startOfWeek(e.completedAt)
    perWeek.set(w, (perWeek.get(w) ?? 0) + 1)
  }
  if ([...perWeek.values()].some((n) => n >= goal)) earned.push('goal-week')

  if (STARTERS.every((s) => entries.some((e) => e.sessionId === s.id))) earned.push('all-starters')
  return earned
}

/** Whole days since the previous session if that gap was a week or more, otherwise 0. */
export function comebackDays(previousCompletedAt: number | undefined, now: number): number {
  if (previousCompletedAt === undefined) return 0
  const days = Math.floor((startOfDay(now) - startOfDay(previousCompletedAt)) / DAY_MS)
  return days >= 7 ? days : 0
}
