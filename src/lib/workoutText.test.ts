import { describe, expect, it } from 'vitest'
import { EXERCISE_MAP, withGear } from '../data/exercises'
import { localizeExercise } from '../i18n'
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

describe('gear modifier', () => {
  const calf = EXERCISE_MAP.get('straight-leg-calf-raise-box')!
  it('adds the gear to the title in every language and to the Strava text', () => {
    expect(localizeExercise(withGear(calf, 'dumbbell'), 'en').name).toBe('Straight-leg calf raise (on box) with dumbbells')
    expect(localizeExercise(withGear(calf, 'dumbbell'), 'nl').name).toContain('met dumbbells')
    expect(localizeExercise(calf, 'en').name).toBe(calf.name)
    const text = workoutText('S', [{ exerciseId: calf.id, value: 12, sets: 3, gear: 'dumbbell' }], (i, g) => localizeExercise(withGear(EXERCISE_MAP.get(i)!, g), 'en'), en)
    expect(text).toBe('S\nStraight-leg calf raise (on box) with dumbbells: 3 sets x 12 reps')
  })
  it('ignores gear an exercise does not support and keeps it in snapshots', () => {
    const plank = EXERCISE_MAP.get('forearm-plank')!
    expect(withGear(plank, 'dumbbell')).toBe(plank)
    expect(snapshotItems([{ exerciseId: calf.id, value: 1, sets: 1, gear: 'band' }])[0].gear).toBe('band')
  })
  it('needs the gear equipment and draws it', () => {
    const g = withGear(calf, 'dumbbell')
    expect(g.equipment).toContain('dumbbell')
    expect(g.gear?.length).toBeGreaterThan(0)
  })
})
