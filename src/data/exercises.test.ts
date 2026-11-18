import { describe, expect, it } from 'vitest'
import { EXERCISES } from './exercises'

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
