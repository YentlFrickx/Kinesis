import { describe, expect, it } from 'vitest'
import type { Exercise, Session } from '../data/types'
import { advance, buildSteps, estimateSeconds, goTo, initState, next, SWITCH_SECONDS } from './engine'

const ex = (id: string, o: Partial<Exercise> = {}): Exercise => ({
  id, name: id, category: 'strength', bodyAreas: [], mode: 'time', defaultValue: 30,
  defaultSets: 1, perSide: false, instructions: [], animation: [], ...o,
})
const lib = new Map([
  ['plank', ex('plank')],
  ['bridge', ex('bridge', { mode: 'reps' })],
  ['hip', ex('hip', { perSide: true })],
])
const lookup = (id: string) => lib.get(id)
const session = (items: Session['items'], over: Partial<Session> = {}): Session => ({
  id: 's', name: 's', items, defaultSetRestSec: 20, defaultTransitionSec: 10, ...over,
})

describe('buildSteps', () => {
  it('adds a get-ready step, then work steps with rests between sets', () => {
    const steps = buildSteps(session([{ exerciseId: 'plank', value: 30, sets: 2 }]), lookup)
    expect(steps.map((s) => (s.kind === 'rest' ? `rest:${s.reason}:${s.seconds}` : `work:${s.set}`))).toEqual([
      'rest:start:10', 'work:1', 'rest:set:20', 'work:2',
    ])
  })

  it('does per-side exercises left then right with a switch step', () => {
    const steps = buildSteps(session([{ exerciseId: 'hip', value: 30, sets: 1 }]), lookup)
    expect(steps.map((s) => (s.kind === 'rest' ? s.reason : (s as { side: string }).side))).toEqual([
      'start', 'left', 'switch', 'right',
    ])
    expect(steps[2]).toMatchObject({ kind: 'rest', seconds: SWITCH_SECONDS })
  })

  it('uses restAfterSec of the previous exercise as the transition, and omits zero rests', () => {
    const steps = buildSteps(
      session([
        { exerciseId: 'plank', value: 30, sets: 1, restAfterSec: 0 },
        { exerciseId: 'bridge', value: 10, sets: 1 },
      ]),
      lookup,
    )
    expect(steps.map((s) => s.kind)).toEqual(['rest', 'work', 'work'])
  })

  it('skips unknown exercises', () => {
    expect(buildSteps(session([{ exerciseId: 'nope', value: 1, sets: 1 }]), lookup)).toEqual([])
  })
})

describe('estimateSeconds', () => {
  it('counts time directly and reps at 3s each', () => {
    const steps = buildSteps(
      session([{ exerciseId: 'plank', value: 30, sets: 1 }, { exerciseId: 'bridge', value: 10, sets: 1 }]),
      lookup,
    )
    expect(estimateSeconds(steps)).toBe(10 + 30 + 10 + 30)
  })
})

describe('run state', () => {
  const steps = buildSteps(session([{ exerciseId: 'plank', value: 5, sets: 1 }], { defaultTransitionSec: 3 }), lookup)

  it('counts down and moves to the next step', () => {
    let st = initState(steps)
    expect(st.remainingMs).toBe(3000)
    st = advance(steps, st, 1000)
    expect(st).toMatchObject({ index: 0, remainingMs: 2000 })
    st = advance(steps, st, 2000)
    expect(st).toMatchObject({ index: 1, remainingMs: 5000, finished: false })
  })

  it('finishes after the last step', () => {
    const st = advance(steps, goTo(steps, 1), 5000)
    expect(st.finished).toBe(true)
  })

  it('rep steps do not tick and must be advanced manually', () => {
    const repSteps = buildSteps(session([{ exerciseId: 'bridge', value: 5, sets: 1 }], { defaultTransitionSec: 0 }), lookup)
    const st = initState(repSteps)
    expect(advance(repSteps, st, 10_000)).toBe(st)
    expect(next(repSteps, st).finished).toBe(true)
  })
})
