import { describe, expect, it } from 'vitest'
import { EXERCISE_MAP } from './exercises'
import { STARTERS } from './templates'
import { buildSteps, estimateSeconds } from '../player/engine'

const minutes = (id: string) => {
  const s = STARTERS.find((x) => x.id === id)!
  return estimateSeconds(buildSteps(s, (i) => EXERCISE_MAP.get(i))) / 60
}

describe('starter sessions', () => {
  it('only reference existing exercises, with unique ids', () => {
    for (const s of STARTERS) for (const i of s.items) expect(EXERCISE_MAP.has(i.exerciseId), i.exerciseId).toBe(true)
    expect(new Set(STARTERS.map((s) => s.id)).size).toBe(STARTERS.length)
  })
  it('runner workout is about 30 minutes', () => {
    expect(minutes('starter-runner-strength')).toBeGreaterThan(28)
    expect(minutes('starter-runner-strength')).toBeLessThan(32)
  })
  it('stretch session is short', () => {
    expect(minutes('starter-feet-calves-stretch')).toBeGreaterThan(5)
    expect(minutes('starter-feet-calves-stretch')).toBeLessThanOrEqual(10)
  })
})
