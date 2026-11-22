import { describe, expect, it } from 'vitest'
import { EXERCISES, EXERCISE_MAP } from './exercises'
import { BODY_AREAS } from './types'

describe('exercises', () => {
  it('have unique ids', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length)
  })

  it('declare the equipment their gear needs', () => {
    for (const e of EXERCISES) {
      for (const g of e.gear ?? []) {
        const need = g.kind === 'band' ? 'band' : 'dumbbell'
        expect(e.equipment, e.id).toContain(need)
      }
    }
  })
})

describe('exercise data integrity', () => {
  const inBox = ([x, y]: readonly [number, number]) => x >= 0 && x <= 200 && y >= 0 && y <= 140

  it('keeps every animation point inside the 200x140 box', () => {
    for (const e of EXERCISES) {
      expect(e.animation.length, e.id).toBeGreaterThan(0)
      for (const f of e.animation) {
        expect(f.ms, e.id).toBeGreaterThan(0)
        for (const [j, p] of Object.entries(f.pose)) expect(inBox(p), `${e.id} ${j} ${p}`).toBe(true)
      }
      for (const p of e.props ?? []) expect(p.x >= 0 && p.y >= 0 && p.x + p.w <= 200 && p.y + p.h <= 140, `${e.id} prop`).toBe(true)
    }
  })

  it('uses valid categories, body areas and defaults', () => {
    for (const e of EXERCISES) {
      expect(['strength', 'stretch', 'mobility'], e.id).toContain(e.category)
      expect(e.bodyAreas.length, e.id).toBeGreaterThan(0)
      for (const a of e.bodyAreas) expect(BODY_AREAS, e.id).toContain(a)
      expect(['time', 'reps'], e.id).toContain(e.mode)
      expect(e.defaultValue, e.id).toBeGreaterThan(0)
      expect(e.defaultSets, e.id).toBeGreaterThan(0)
      expect(e.instructions.length, e.id).toBeGreaterThan(0)
    }
  })
})

describe('coaching content', () => {
  it('gives every exercise cues and mistakes', () => {
    for (const e of EXERCISES) {
      expect(e.cues?.length, e.id).toBeGreaterThan(0)
      expect(e.commonMistakes?.length, e.id).toBeGreaterThan(0)
    }
  })
  it('points easier/harder at existing, different exercises', () => {
    for (const e of EXERCISES) {
      for (const id of [e.easier, e.harder]) {
        if (id === undefined) continue
        expect(EXERCISE_MAP.has(id), `${e.id} -> ${id}`).toBe(true)
        expect(id, e.id).not.toBe(e.id)
      }
    }
  })
})

describe('gear options', () => {
  it('only reference known exercises and valid gear drawings', () => {
    for (const e of EXERCISES) {
      for (const [q, drawn] of Object.entries(e.gearOptions ?? {})) {
        expect(['dumbbell', 'band'], e.id).toContain(q)
        for (const g of drawn) expect(g.kind === 'band' ? 'band' : 'dumbbell', e.id).toBe(q)
      }
    }
  })
})
