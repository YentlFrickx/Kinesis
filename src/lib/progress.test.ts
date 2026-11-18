import { describe, expect, it } from 'vitest'
import type { HistoryEntry } from '../store/history'
import { balanceNudge, comebackDays, earnedMilestones, heatmap, sessionsThisWeek, startOfWeek, weekDays, weeklyBalance } from './progress'

// Wed 2026-11-18 12:00 local
const NOW = new Date(2026, 10, 18, 12).getTime()
const at = (y: number, m: number, d: number, sessionId = 's'): HistoryEntry => ({
  id: `${y}-${m}-${d}-${Math.random()}`, sessionId, sessionName: sessionId,
  completedAt: new Date(y, m - 1, d, 9).getTime(), durationSec: 600,
})

describe('weeks', () => {
  it('starts on Monday', () => {
    expect(new Date(startOfWeek(NOW)).getDay()).toBe(1)
    expect(new Date(startOfWeek(new Date(2026, 10, 22, 23).getTime())).getDate()).toBe(16) // Sunday -> Mon 16
  })
  it('counts only the current week', () => {
    const e = [at(2026, 11, 16), at(2026, 11, 18), at(2026, 11, 15), at(2026, 11, 23)]
    expect(sessionsThisWeek(e, NOW)).toBe(2)
  })
})

describe('weekDays', () => {
  it('returns Monday-first days with per-day counts and marks today', () => {
    const days = weekDays([at(2026, 11, 16), at(2026, 11, 16), at(2026, 11, 18), at(2026, 11, 15)], NOW)
    expect(days.map((d) => d.count)).toEqual([2, 0, 1, 0, 0, 0, 0])
    expect(days.map((d) => d.today)).toEqual([false, false, true, false, false, false, false])
  })
})

describe('heatmap', () => {
  it('has requested weeks of 7 days, flags future days and counts', () => {
    const h = heatmap([at(2026, 11, 18), at(2026, 11, 18)], NOW, 4)
    expect(h).toHaveLength(4)
    expect(h.every((w) => w.length === 7)).toBe(true)
    const wed = h[3][2]
    expect(wed.count).toBe(2)
    expect(wed.future).toBe(false)
    expect(h[3][3].future).toBe(true)
    expect(h[0][0].future).toBe(false)
  })
})

describe('milestones', () => {
  it('awards count milestones', () => {
    expect(earnedMilestones([], 3)).toEqual([])
    expect(earnedMilestones([at(2026, 11, 1)], 3)).toEqual(['first-session'])
    const ten = Array.from({ length: 10 }, (_, i) => at(2026, 10, i + 1))
    expect(earnedMilestones(ten, 99)).toContain('sessions-10')
  })
  it('awards goal week on any week meeting the goal', () => {
    const e = [at(2026, 11, 2), at(2026, 11, 3), at(2026, 11, 4)]
    expect(earnedMilestones(e, 3)).toContain('goal-week')
    expect(earnedMilestones(e, 4)).not.toContain('goal-week')
  })
  it('awards all-starters', () => {
    const e = [at(2026, 11, 1, 'starter-runner-strength'), at(2026, 11, 2, 'starter-feet-calves-stretch')]
    expect(earnedMilestones(e, 9)).toContain('all-starters')
  })
})

describe('comebackDays', () => {
  it('only triggers after a week or more', () => {
    expect(comebackDays(undefined, NOW)).toBe(0)
    expect(comebackDays(at(2026, 11, 12).completedAt, NOW)).toBe(0) // 6 days
    expect(comebackDays(at(2026, 11, 11).completedAt, NOW)).toBe(7)
  })
})

describe('balance', () => {
  const withCats = (e: HistoryEntry, categories: HistoryEntry['categories']): HistoryEntry => ({ ...e, categories })
  it('sums categories for the current week, skipping old entries without data', () => {
    const e = [
      withCats(at(2026, 11, 16), { strength: 5, stretch: 1 }),
      withCats(at(2026, 11, 17), { strength: 2, mobility: 3 }),
      withCats(at(2026, 11, 9), { strength: 9 }), // last week
      at(2026, 11, 18), // no category data
    ]
    expect(weeklyBalance(e, NOW)).toEqual({ strength: 7, stretch: 1, mobility: 3 })
  })
  it('nudges only about missing categories, and not on an empty week', () => {
    expect(balanceNudge({ strength: 0, stretch: 0, mobility: 0 })).toBeNull()
    expect(balanceNudge({ strength: 3, stretch: 1, mobility: 1 })).toBeNull()
    expect(balanceNudge({ strength: 3, stretch: 0, mobility: 0 })).toContain('stretching or mobility')
    expect(balanceNudge({ strength: 3, stretch: 2, mobility: 0 })).toContain('mobility')
  })
})
