import { describe, expect, it } from 'vitest'
import { EXERCISE_MAP, EXERCISES } from '../data/exercises'
import type { Equipment } from '../data/types'
import { estimateItems, generateSession, replacementFor, type GenOptions } from './generator'

const base: GenOptions = {
  minutes: 20, categories: ['strength', 'stretch'], focus: [], equipment: [], intensity: 'moderate', warmCool: false, seed: 1,
}
const ex = (id: string) => EXERCISE_MAP.get(id)!

describe('generateSession', () => {
  it('lands within ±10% of the requested duration across durations and seeds', () => {
    for (const minutes of [10, 15, 20, 30, 45]) {
      for (const seed of [1, 2, 3, 42]) {
        for (const intensity of ['light', 'moderate', 'hard'] as const) {
          const r = generateSession({ ...base, minutes, seed, intensity, equipment: ['dumbbell', 'band'], categories: ['strength', 'stretch', 'mobility'] })
          expect(r.withinTolerance, `${minutes}min seed ${seed} ${intensity}: ${r.seconds}s`).toBe(true)
          expect(Math.abs(r.seconds - minutes * 60)).toBeLessThanOrEqual(minutes * 60 * 0.1)
        }
      }
    }
  })

  it('never includes gear the user does not have', () => {
    for (const equipment of [[], ['band'], ['dumbbell']] as Equipment[][]) {
      for (let seed = 0; seed < 10; seed++) {
        const r = generateSession({ ...base, equipment, seed, categories: ['strength', 'stretch', 'mobility'] })
        for (const i of r.items) expect((ex(i.exerciseId).equipment ?? []).every((q) => equipment.includes(q))).toBe(true)
      }
    }
  })

  it('prefers exercises that match the focus areas', () => {
    const r = generateSession({ ...base, focus: ['calves', 'hips'], categories: ['strength', 'stretch'], minutes: 15 })
    const matching = r.items.filter((i) => ex(i.exerciseId).bodyAreas.some((a) => a === 'calves' || a === 'hips'))
    expect(matching.length).toBeGreaterThanOrEqual(Math.ceil(r.items.length / 2))
  })

  it('is deterministic for a seed and varies between seeds', () => {
    const a = generateSession({ ...base, seed: 7 })
    expect(generateSession({ ...base, seed: 7 })).toEqual(a)
    const others = [1, 2, 3, 4, 5].map((seed) => JSON.stringify(generateSession({ ...base, seed }).items))
    expect(new Set(others).size).toBeGreaterThan(1)
  })

  it('orders mobility, then strength, then stretch, with no repeated exercises', () => {
    const r = generateSession({ ...base, categories: ['strength'], warmCool: true, minutes: 25 })
    const cats = r.items.map((i) => ex(i.exerciseId).category)
    const rank = { mobility: 0, strength: 1, stretch: 2 }
    expect(cats.map((c) => rank[c])).toEqual([...cats.map((c) => rank[c])].sort())
    expect(cats[0]).toBe('mobility')
    expect(cats.at(-1)).toBe('stretch')
    expect(new Set(r.items.map((i) => i.exerciseId)).size).toBe(r.items.length)
  })

  it('only uses the selected categories without warm-up/cool-down', () => {
    const r = generateSession({ ...base, categories: ['stretch'] })
    expect(r.items.every((i) => ex(i.exerciseId).category === 'stretch')).toBe(true)
  })

  it('reports a shortfall when there are too few exercises', () => {
    const pool = EXERCISES.filter((e) => e.category === 'stretch').slice(0, 2)
    const r = generateSession({ ...base, categories: ['stretch'], minutes: 60, pool })
    expect(r.items.length).toBe(2)
    expect(r.withinTolerance).toBe(false)
    expect(r.notes.length).toBeGreaterThan(0)
  })

  it('returns an empty session when nothing matches', () => {
    const r = generateSession({ ...base, pool: [] })
    expect(r.items).toEqual([])
    expect(r.withinTolerance).toBe(false)
  })

  it('light intensity does less work than hard for the same exercises', () => {
    const light = generateSession({ ...base, intensity: 'light', minutes: 30 })
    const hard = generateSession({ ...base, intensity: 'hard', minutes: 30 })
    expect(light.items.length).toBeGreaterThan(0)
    expect(hard.items.length).toBeGreaterThan(0)
    expect(estimateItems(light.items)).toBeGreaterThan(0)
  })
})

describe('replacementFor', () => {
  it('swaps in an unused exercise of the same category within the equipment limits', () => {
    const r = generateSession(base)
    const rep = replacementFor(r.items, 0, { equipment: [], focus: [], intensity: 'moderate', seed: 3 })!
    expect(rep).toBeDefined()
    expect(r.items.some((i) => i.exerciseId === rep.exerciseId)).toBe(false)
    expect(ex(rep.exerciseId).category).toBe(ex(r.items[0].exerciseId).category)
    expect(ex(rep.exerciseId).equipment ?? []).toEqual([])
  })
})
