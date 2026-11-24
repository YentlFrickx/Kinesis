import { describe, expect, it } from 'vitest'
import { EXERCISES } from '../data/exercises'
import { DEFAULT_FILTERS, activeFilterCount, filterExercises, recentExerciseIds, type FilterContext } from './exerciseFilter'

const ctx: FilterContext = {
  favorites: new Set(), recent: new Set(), inSession: new Set(), have: ['dumbbell', 'band'], areaLabel: (a) => a,
}
const run = (patch = {}, c: Partial<FilterContext> = {}) =>
  filterExercises(EXERCISES, { ...DEFAULT_FILTERS, ...patch }, { ...ctx, ...c })

describe('filterExercises', () => {
  it('returns everything by default (all equipment owned), sorted A–Z', () => {
    const r = run()
    expect(r).toHaveLength(EXERCISES.length)
    expect(r.map((e) => e.name)).toEqual([...r.map((e) => e.name)].sort((a, b) => a.localeCompare(b)))
  })
  it('ORs within a group', () => {
    const r = run({ categories: ['stretch', 'mobility'] })
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((e) => e.category !== 'strength')).toBe(true)
  })
  it('ANDs across groups', () => {
    const r = run({ categories: ['strength'], areas: ['core'], mode: 'time' })
    expect(r.every((e) => e.category === 'strength' && e.bodyAreas.includes('core') && e.mode === 'time')).toBe(true)
  })
  it('filters by per-side and equipment need', () => {
    expect(run({ perSide: 'yes' }).every((e) => e.perSide)).toBe(true)
    expect(run({ equipment: ['none'] }).every((e) => !e.equipment?.length)).toBe(true)
    expect(run({ equipment: ['band'] }).every((e) => e.equipment?.includes('band'))).toBe(true)
  })
  it('hides exercises needing unowned equipment', () => {
    expect(run({}, { have: [] }).every((e) => !e.equipment?.length)).toBe(true)
  })
  it('applies favourites, recent and not-in-session', () => {
    const [a, b] = EXERCISES
    expect(run({ favoritesOnly: true }, { favorites: new Set([a.id]) }).map((e) => e.id)).toEqual([a.id])
    expect(run({ recentOnly: true }, { recent: new Set([b.id]) }).map((e) => e.id)).toEqual([b.id])
    const r = run({ notInSession: true }, { inSession: new Set([a.id]) })
    expect(r.some((e) => e.id === a.id)).toBe(false)
    expect(r).toHaveLength(EXERCISES.length - 1)
  })
  it('searches name, area label and instructions, ignoring case and accents', () => {
    const e = EXERCISES[0]
    expect(run({ query: e.name.toUpperCase() }).some((x) => x.id === e.id)).toBe(true)
    expect(run({ query: e.instructions[0].slice(0, 20) }).some((x) => x.id === e.id)).toBe(true)
    expect(run({ query: 'zzzzqqq' })).toEqual([])
    expect(run({ query: 'glutes' }, { areaLabel: () => 'bil' }).length).toBeGreaterThan(0)
    expect(run({ query: 'bil' }, { areaLabel: () => 'bil' }).length).toBe(EXERCISES.length)
  })
  it('sorts by category', () => {
    const order = ['strength', 'stretch', 'mobility']
    const idx = run({ sort: 'category' }).map((e) => order.indexOf(e.category))
    expect(idx).toEqual([...idx].sort((x, y) => x - y))
  })
  it('sorts by the displayed (localised) body-area label', () => {
    // Reverse the alphabet: a label-based sort must then put "upper back" before "calves".
    const label = (a: string) => [...a].map((ch) => String.fromCharCode(219 - ch.charCodeAt(0))).join('')
    const firsts = run({ sort: 'area' }, { areaLabel: label }).map((e) => label(e.bodyAreas[0]))
    expect(firsts).toEqual([...firsts].sort((a, b) => a.localeCompare(b)))
  })
})

describe('helpers', () => {
  it('counts active filters', () => {
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0)
    expect(activeFilterCount({ ...DEFAULT_FILTERS, query: 'x', areas: ['core', 'hips'], favoritesOnly: true })).toBe(4)
  })
  it('collects recent exercise ids', () => {
    const ids = recentExerciseIds([{ items: [{ exerciseId: 'a' }] }, {}, { items: [{ exerciseId: 'b' }] }], 2)
    expect([...ids]).toEqual(['a'])
  })
})
