import { EXERCISES, canDo } from '../data/exercises'
import type { BodyArea, Category, Equipment, Exercise, Session, SessionItem } from '../data/types'
import { buildSteps, estimateSeconds } from '../player/engine'
import type { MessageKey } from '../i18n/en'

export type Intensity = 'light' | 'moderate' | 'hard'
export const INTENSITIES: readonly Intensity[] = ['light', 'moderate', 'hard']

/** Sets/reps preset: sets are offset from the exercise default, values are scaled. */
const PRESET: Record<Intensity, { sets: number; value: number }> = {
  light: { sets: -1, value: 0.8 },
  moderate: { sets: 0, value: 1 },
  hard: { sets: 1, value: 1.2 },
}

export interface GenOptions {
  minutes: number
  categories: readonly Category[]
  focus: readonly BodyArea[]
  equipment: readonly Equipment[]
  intensity: Intensity
  /** Adds mobility exercises up front and stretches at the end, even if those categories are not selected. */
  warmCool: boolean
  seed: number
  /** Exercise pool; defaults to the full library. */
  pool?: readonly Exercise[]
}

export interface GenResult {
  items: SessionItem[]
  seconds: number
  targetSeconds: number
  /** True when `seconds` is within ±10% of the target. */
  withinTolerance: boolean
  notes: GenNote[]
}

/** A message for the UI to translate: catalog key plus its parameters. */
export interface GenNote {
  key: MessageKey
  params?: Record<string, string | number>
}

export const SET_REST_SEC = 30
export const TRANSITION_SEC = 10
const TOLERANCE = 0.1
const ORDER: readonly Category[] = ['mobility', 'strength', 'stretch']
const PUSH: readonly BodyArea[] = ['chest', 'shoulders', 'arms']
const PULL: readonly BodyArea[] = ['upper back']

/** Small deterministic PRNG (mulberry32) returning values in [0, 1). */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5)

/** The session item for an exercise at the given intensity; `factor` scales the work amount. */
function toItem(ex: Exercise, intensity: Intensity, factor = 1): SessionItem {
  const p = PRESET[intensity]
  const raw = ex.defaultValue * p.value * factor
  return {
    exerciseId: ex.id,
    value: ex.mode === 'time' ? round5(raw) : Math.max(3, Math.round(raw)),
    sets: Math.max(1, ex.defaultSets + p.sets),
  }
}

const asSession = (items: SessionItem[]): Session => ({
  id: 'generated', name: '', items, defaultSetRestSec: SET_REST_SEC, defaultTransitionSec: TRANSITION_SEC,
})

/** Estimated seconds for items drawn from the library. */
export function estimateItems(items: SessionItem[], pool: readonly Exercise[] = EXERCISES): number {
  const map = new Map(pool.map((e) => [e.id, e]))
  return estimateSeconds(buildSteps(asSession(items), (id) => map.get(id)))
}

const focusScore = (e: Exercise, focus: readonly BodyArea[]) =>
  e.bodyAreas.reduce((s, a) => s + (focus.includes(a) ? 1 : a === 'full body' && focus.length ? 0.3 : 0), 0)

export function generateSession(opts: GenOptions): GenResult {
  const all = opts.pool ?? EXERCISES
  const rand = rng(opts.seed)
  const target = Math.round(opts.minutes * 60)
  const notes: GenNote[] = []
  const usable = all.filter((e) => canDo(e, opts.equipment))

  // Selected categories get equal weight; warm-up/cool-down categories get a smaller share.
  const weights = new Map<Category, number>()
  for (const c of opts.categories) weights.set(c, 1)
  if (opts.warmCool) {
    if (!weights.has('mobility')) weights.set('mobility', 0.4)
    if (!weights.has('stretch')) weights.set('stretch', 0.4)
  }
  const cats = ORDER.filter((c) => weights.has(c))
  const totalWeight = cats.reduce((s, c) => s + weights.get(c)!, 0)

  const chosen = new Map<Category, Exercise[]>(cats.map((c) => [c, []]))
  const taken = (c: Category) => chosen.get(c)!
  const itemSecs = (e: Exercise) => estimateItems([toItem(e, opts.intensity)], all)
  const catSecs = (c: Category) => taken(c).reduce((s, e) => s + itemSecs(e), 0)

  const pick = (c: Category): Exercise | undefined => {
    const have = cats.flatMap(taken)
    const left = usable.filter((e) => e.category === c && !have.includes(e))
    if (left.length === 0) return undefined
    let cands = left
    if (opts.focus.length) {
      const matching = left.filter((e) => focusScore(e, opts.focus) > 0)
      if (matching.length) cands = matching
      else if (opts.categories.includes(c) && taken(c).length === 0) {
        notes.push({ key: 'gen.note.noFocus', params: { category: c } })
      }
    }
    const covered = new Set(have.flatMap((e) => e.bodyAreas))
    const pushes = have.filter((e) => e.bodyAreas.some((a) => PUSH.includes(a))).length
    const pulls = have.filter((e) => e.bodyAreas.some((a) => PULL.includes(a))).length
    const score = (e: Exercise) => {
      const novelty = e.bodyAreas.filter((a) => !covered.has(a)).length
      const balance = e.bodyAreas.some((a) => PUSH.includes(a)) ? Math.sign(pulls - pushes)
        : e.bodyAreas.some((a) => PULL.includes(a)) ? Math.sign(pushes - pulls) : 0
      return focusScore(e, opts.focus) * 3 + novelty + balance * 0.8 + rand() * 1.5
    }
    return cands.map((e) => [e, score(e)] as const).sort((a, b) => b[1] - a[1])[0][0]
  }

  // At least one exercise per category, then fill whichever category is furthest below its share.
  for (const c of cats) {
    const e = pick(c)
    if (e) taken(c).push(e)
  }
  const build = () => cats.flatMap(taken).map((e) => toItem(e, opts.intensity))
  const added: Category[] = []
  while (estimateItems(build(), all) < target * 0.97) {
    const open = cats
      .map((c) => [c, (weights.get(c)! / totalWeight) * target - catSecs(c)] as const)
      .sort((a, b) => b[1] - a[1])
    let done = false
    for (const [c] of open) {
      const e = pick(c)
      if (e) {
        taken(c).push(e)
        added.push(c)
        done = true
        break
      }
    }
    if (!done) break
  }
  // Selection overshot (e.g. a few very long exercises): drop the most recent additions.
  while (estimateItems(build(), all) > target * 1.25 && added.length) taken(added.pop()!).pop()

  const exercises = cats.flatMap(taken)
  if (exercises.length === 0) {
    notes.push({ key: 'gen.note.noMatch' })
    return { items: [], seconds: 0, targetSeconds: target, withinTolerance: false, notes }
  }

  // Fine-tune the amount of work per exercise so the total lands on the target.
  const at = (f: number) => exercises.map((e) => toItem(e, opts.intensity, f))
  let lo = 0.4
  let hi = 2
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2
    if (estimateItems(at(mid), all) < target) lo = mid
    else hi = mid
  }
  const candidates = [lo, hi].map((f) => at(f))
  const items = candidates.sort((a, b) => Math.abs(estimateItems(a, all) - target) - Math.abs(estimateItems(b, all) - target))[0]
  const seconds = estimateItems(items, all)
  const withinTolerance = Math.abs(seconds - target) <= target * TOLERANCE
  if (!withinTolerance) {
    notes.push({ key: seconds < target ? 'gen.note.tooShort' : 'gen.note.tooLong', params: { minutes: Math.round(seconds / 60) } })
  }
  return { items, seconds, targetSeconds: target, withinTolerance, notes }
}

/** Another exercise of the same category (respecting equipment) to swap in for `items[index]`, or undefined if none is left. */
export function replacementFor(items: SessionItem[], index: number, opts: Pick<GenOptions, 'equipment' | 'focus' | 'intensity' | 'seed' | 'pool'>): SessionItem | undefined {
  const all = opts.pool ?? EXERCISES
  const current = all.find((e) => e.id === items[index]?.exerciseId)
  if (!current) return undefined
  const used = new Set(items.map((i) => i.exerciseId))
  const left = all.filter((e) => e.category === current.category && !used.has(e.id) && canDo(e, opts.equipment))
  if (left.length === 0) return undefined
  const rand = rng(opts.seed)
  const best = left
    .map((e) => [e, focusScore(e, opts.focus) * 3 + rand()] as const)
    .sort((a, b) => b[1] - a[1])[0][0]
  // Keep a similar amount of time: scale the new exercise to the old one's duration.
  const oldSecs = estimateItems([items[index]], all)
  let f = 1
  const base = estimateItems([toItem(best, opts.intensity)], all)
  if (base > 0) f = Math.min(2, Math.max(0.4, oldSecs / base))
  return toItem(best, opts.intensity, f)
}
