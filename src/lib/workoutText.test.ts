import { describe, expect, it } from 'vitest'
import { EXERCISE_MAP } from '../data/exercises'
import { translate } from '../i18n/core'
import { snapshotItems, workoutText } from './workoutText'

const en = (k: Parameters<typeof translate>[1], p?: Parameters<typeof translate>[2]) => translate('en', k, p)
const ids = [...EXERCISE_MAP.values()]
const reps = ids.find((e) => e.mode === 'reps' && !e.perSide)!
const timedSide = ids.find((e) => e.mode === 'time' && e.perSide)!

describe('workoutText', () => {
  it('lists sets x amount per exercise, with side and note', () => {
    const text = workoutText('My session', [
      { exerciseId: reps.id, value: 12, sets: 3 },
      { exerciseId: timedSide.id, value: 30, sets: 1, note: '8 kg' },
      { exerciseId: 'missing', value: 1, sets: 1 },
    ], (i) => EXERCISE_MAP.get(i), en)
    expect(text).toBe(`My session\n${reps.name}: 3 sets x 12 reps\n${timedSide.name}: 1 set x 30 sec each side (8 kg)`)
  })
  it('snapshots only the fields worth keeping', () => {
    expect(snapshotItems([{ id: 'x', exerciseId: 'a', value: 1, sets: 2, restAfterSec: 5 }])).toEqual([{ exerciseId: 'a', value: 1, sets: 2 }])
  })
})
