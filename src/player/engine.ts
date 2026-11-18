import type { Exercise, Session } from '../data/types'

export const SWITCH_SECONDS = 5
export const SECONDS_PER_REP = 3

export type Side = 'left' | 'right'
export type RestReason = 'start' | 'set' | 'switch' | 'exercise'

export interface WorkStep {
  kind: 'work'
  exercise: Exercise
  mode: 'time' | 'reps'
  value: number
  set: number
  sets: number
  side: Side | null
  itemIndex: number
}

export interface RestStep {
  kind: 'rest'
  reason: RestReason
  seconds: number
  /** The exercise coming up next, shown as a preview. */
  next: Exercise
  side: Side | null
  itemIndex: number
}

export type Step = WorkStep | RestStep

/**
 * Expands a session into a flat list of steps.
 * Order per exercise: for each set -> (left, switch, right) or a single work step,
 * with a rest between sets. A rest/"get ready" step precedes each exercise
 * (the session start uses the default transition; later ones use the previous
 * exercise's `restAfterSec` override if set). Zero-length rests are omitted.
 */
export function buildSteps(session: Session, lookup: (id: string) => Exercise | undefined): Step[] {
  const steps: Step[] = []
  let prevRestAfter: number | undefined
  let first = true
  session.items.forEach((item, itemIndex) => {
    const ex = lookup(item.exerciseId)
    if (!ex) return
    const sets = Math.max(1, item.sets)
    const sides: (Side | null)[] = ex.perSide ? ['left', 'right'] : [null]

    const lead = first ? session.defaultTransitionSec : (prevRestAfter ?? session.defaultTransitionSec)
    if (lead > 0) {
      steps.push({ kind: 'rest', reason: first ? 'start' : 'exercise', seconds: lead, next: ex, side: sides[0], itemIndex })
    }
    first = false
    prevRestAfter = item.restAfterSec

    for (let set = 1; set <= sets; set++) {
      sides.forEach((side, i) => {
        if (i > 0) steps.push({ kind: 'rest', reason: 'switch', seconds: SWITCH_SECONDS, next: ex, side, itemIndex })
        steps.push({ kind: 'work', exercise: ex, mode: ex.mode, value: item.value, set, sets, side, itemIndex })
      })
      if (set < sets && session.defaultSetRestSec > 0) {
        steps.push({ kind: 'rest', reason: 'set', seconds: session.defaultSetRestSec, next: ex, side: sides[0], itemIndex })
      }
    }
  })
  return steps
}

/** Estimated total seconds (reps are assumed to take SECONDS_PER_REP each). */
export function estimateSeconds(steps: Step[]): number {
  return steps.reduce(
    (sum, s) => sum + (s.kind === 'rest' ? s.seconds : s.mode === 'time' ? s.value : s.value * SECONDS_PER_REP),
    0,
  )
}

/** Duration of a step in ms; Infinity for rep-based steps (user taps "done"). */
export function stepMs(s: Step): number {
  if (s.kind === 'rest') return s.seconds * 1000
  return s.mode === 'time' ? s.value * 1000 : Infinity
}

export interface RunState {
  index: number
  remainingMs: number
  finished: boolean
}

export function goTo(steps: Step[], index: number): RunState {
  if (index >= steps.length) return { index: steps.length - 1, remainingMs: 0, finished: true }
  const i = Math.max(0, index)
  return { index: i, remainingMs: stepMs(steps[i]), finished: false }
}

export const initState = (steps: Step[]): RunState => goTo(steps, 0)

/** Advances the running step by `dtMs`; moves on to the next step when it runs out. */
export function advance(steps: Step[], st: RunState, dtMs: number): RunState {
  if (st.finished || !Number.isFinite(st.remainingMs)) return st
  const remaining = st.remainingMs - dtMs
  return remaining > 0 ? { ...st, remainingMs: remaining } : goTo(steps, st.index + 1)
}

export const next = (steps: Step[], st: RunState): RunState => goTo(steps, st.index + 1)
export const prev = (steps: Step[], st: RunState): RunState => goTo(steps, st.index - 1)
