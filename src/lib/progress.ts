import { STARTERS } from '../data/templates'
import type { Category, Session } from '../data/types'
import type { HistoryEntry } from '../store/history'

const DAY_MS = 86_400_000

/** Local midnight of the day containing `t`. */
function startOfDay(t: number): number {
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

/** Monday-first days of the week containing `now`, with how many sessions were completed on each. */
export function weekDays(entries: HistoryEntry[], now: number): { day: number; count: number; today: boolean }[] {
  const from = startOfWeek(now)
  const today = startOfDay(now)
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(from, i)
    const count = entries.filter((e) => startOfDay(e.completedAt) === day).length
    return { day, count, today: day === today }
  })
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

/** Milestone ids; their titles and descriptions live in the i18n catalogs (`milestone.<id>.title` / `.desc`). */
export const MILESTONES = ['first-session', 'sessions-10', 'sessions-50', 'goal-week', 'all-starters'] as const
export type MilestoneId = (typeof MILESTONES)[number]

/** Ids of the milestones that the given history satisfies. */
export function earnedMilestones(entries: HistoryEntry[], goal: number): MilestoneId[] {
  const earned: MilestoneId[] = []
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

export const CATEGORIES: readonly Category[] = ['strength', 'stretch', 'mobility']

/** Number of exercises per category in a session (unknown exercises are ignored). */
export function sessionCategories(session: Session, categoryOf: (exerciseId: string) => Category | undefined) {
  const counts: Partial<Record<Category, number>> = {}
  for (const item of session.items) {
    const c = categoryOf(item.exerciseId)
    if (c) counts[c] = (counts[c] ?? 0) + 1
  }
  return counts
}

/** Exercises done per category in the calendar week that contains `now`. Entries without category data are skipped. */
export function weeklyBalance(entries: HistoryEntry[], now: number): Record<Category, number> {
  const from = startOfWeek(now)
  const to = addDays(from, 7)
  const total: Record<Category, number> = { strength: 0, stretch: 0, mobility: 0 }
  for (const e of entries) {
    if (e.completedAt < from || e.completedAt >= to || !e.categories) continue
    for (const c of CATEGORIES) total[c] += e.categories[c] ?? 0
  }
  return total
}

/** Categories the week so far leaves out, for a gentle nudge; empty when balanced or when there is nothing to go on yet. */
export function missingCategories(balance: Record<Category, number>): Category[] {
  if (CATEGORIES.every((c) => balance[c] === 0)) return []
  return CATEGORIES.filter((c) => balance[c] === 0)
}
