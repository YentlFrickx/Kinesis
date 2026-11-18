import { describe, expect, it } from 'vitest'
import type { Session } from '../data/types'
import { sessionEquipment, youllNeed } from './equipment'

const session = (...ids: string[]): Session => ({
  id: 's', name: 's', defaultSetRestSec: 30, defaultTransitionSec: 10,
  items: ids.map((exerciseId) => ({ exerciseId, value: 10, sets: 1 })),
})

describe('session equipment', () => {
  it('is empty for bodyweight sessions', () => {
    expect(sessionEquipment(session('push-up', 'plank'))).toEqual([])
    expect(youllNeed(session('push-up'))).toBeNull()
  })

  it('lists each needed item once, in a stable order', () => {
    const s = session('seated-band-row', 'goblet-squat', 'banded-clamshell', 'unknown-id')
    expect(sessionEquipment(s)).toEqual(['dumbbell', 'band'])
    expect(youllNeed(s)).toBe("You'll need: Dumbbells, Resistance band")
  })
})
