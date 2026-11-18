import { afterEach, describe, expect, it, vi } from 'vitest'
import { installStorage } from './testStorage'

afterEach(() => vi.unstubAllGlobals())
const load = async (initial?: Record<string, string>) => {
  installStorage(initial)
  return import('./goal')
}

describe('goal store', () => {
  it('defaults and clamps', async () => {
    const g = await load()
    expect(g.getGoal()).toBe(g.DEFAULT_GOAL)
    g.setGoal(0); expect(g.getGoal()).toBe(1)
    g.setGoal(99); expect(g.getGoal()).toBe(g.MAX_GOAL)
    g.setGoal(3.6); expect(g.getGoal()).toBe(4)
  })

  it('persists and clamps stored values', async () => {
    const g = await load({ 'rw.goal.v1': JSON.stringify({ weekly: 100 }) })
    expect(g.getGoal()).toBe(g.MAX_GOAL)
    expect((await load({ 'rw.goal.v1': 'junk' })).getGoal()).toBe(3)
  })
})
