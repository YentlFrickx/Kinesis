import { describe, expect, it } from 'vitest'
import type { Exercise, Session } from '../data/types'
import { advance, buildSteps, estimateSeconds, goTo, initState, next, resumeState, SECONDS_PER_REP, stepMs, SWITCH_SECONDS } from './engine'

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

  const long = buildSteps(session([{ exerciseId: 'plank', value: 5, sets: 3 }], { defaultTransitionSec: 3 }), lookup)

  it('catches up across several long with a large dt, carrying leftover time', () => {
    const st = advance(long, initState(long), 3000 + 5000 + 1500)
    expect(st).toMatchObject({ index: 2, finished: false })
    expect(st.remainingMs).toBe(stepMs(long[2]) - 1500)
  })

  it('catch-up equals many small ticks', () => {
    let a = initState(long)
    for (let i = 0; i < 95; i++) a = advance(long, a, 100)
    expect(advance(long, initState(long), 9500)).toEqual(a)
  })

  it('finishes when dt exceeds the whole session, and stops at manual rep steps', () => {
    expect(advance(steps, initState(steps), 10 * 60_000).finished).toBe(true)
    const mixed = buildSteps(session([
      { exerciseId: 'plank', value: 5, sets: 1 }, { exerciseId: 'bridge', value: 5, sets: 1 },
    ], { defaultTransitionSec: 0 }), lookup)
    expect(advance(mixed, initState(mixed), 60_000)).toMatchObject({ index: 1, finished: false, remainingMs: Infinity })
  })

  it('pause/resume preserves remaining time (no dt applied while paused)', () => {
    let st = advance(steps, initState(steps), 1234)
    const paused = st
    st = advance(steps, st, 0)
    expect(st).toEqual(paused)
    expect(st.remainingMs).toBe(3000 - 1234)
  })

  it('auto-advance paces rep steps at SECONDS_PER_REP', () => {
    const repSteps = buildSteps(session([{ exerciseId: 'bridge', value: 5, sets: 1 }], { defaultTransitionSec: 0 }), lookup)
    let st = initState(repSteps, true)
    expect(st.remainingMs).toBe(5 * SECONDS_PER_REP * 1000)
    st = advance(repSteps, st, 5 * SECONDS_PER_REP * 1000, true)
    expect(st.finished).toBe(true)
  })
})

describe('rest after the last item', () => {
  it('ignores restAfterSec on the last item (no trailing rest)', () => {
    const mk = (restAfterSec?: number): Session => ({
      id: 's', name: 's', defaultSetRestSec: 0, defaultTransitionSec: 0,
      items: [{ exerciseId: 'plank', value: 5, sets: 1, restAfterSec }],
    })
    const look = (i: string) => lib.get(i)
    expect(buildSteps(mk(60), look)).toEqual(buildSteps(mk(undefined), look))
    expect(buildSteps(mk(60), look).at(-1)?.kind).toBe('work')
  })
})

describe('resumeState', () => {
  const steps = buildSteps(session([{ exerciseId: 'plank', value: 30, sets: 1 }, { exerciseId: 'bridge', value: 5, sets: 1 }]), lookup)
  const rep = steps.findIndex((s) => s.kind === 'work' && s.mode === 'reps')
  it('keeps the saved remaining time of a timed step, capped at its length', () => {
    expect(resumeState(steps, 1, 12_000)).toEqual({ index: 1, remainingMs: 12_000, finished: false })
    expect(resumeState(steps, 1, 999_000).remainingMs).toBe(30_000)
  })
  it('a rep step saved as manual is paced when auto-reps is now on (not stuck at Infinity)', () => {
    expect(resumeState(steps, rep, null, true).remainingMs).toBe(5 * SECONDS_PER_REP * 1000)
  })
  it('a rep step saved while paced waits for Done when auto-reps is now off', () => {
    expect(resumeState(steps, rep, 4_000, false).remainingMs).toBe(Infinity)
  })
})
