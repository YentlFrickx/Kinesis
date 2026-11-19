import { canDo } from '../store/equipment'
import type { BodyArea, Category, Equipment, Exercise } from '../data/types'

export type SortKey = 'az' | 'category' | 'area'

export interface ExerciseFilters {
  query: string
  /** OR within the group; empty = any. */
  categories: Category[]
  areas: BodyArea[]
  /** Equipment the exercise needs ('none' = bodyweight only). */
  equipment: (Equipment | 'none')[]
  perSide: 'any' | 'yes' | 'no'
  mode: 'any' | 'time' | 'reps'
  favoritesOnly: boolean
  recentOnly: boolean
  notInSession: boolean
  /** Hide exercises needing equipment the user has not selected. */
  onlyMyEquipment: boolean
  sort: SortKey
}

export const DEFAULT_FILTERS: ExerciseFilters = {
  query: '', categories: [], areas: [], equipment: [], perSide: 'any', mode: 'any',
  favoritesOnly: false, recentOnly: false, notInSession: false, onlyMyEquipment: true, sort: 'az',
}

export interface FilterContext {
  favorites: ReadonlySet<string>
  recent: ReadonlySet<string>
  inSession: ReadonlySet<string>
  have: readonly Equipment[]
  /** Localised label for a body area (so search matches what the user sees). */
  areaLabel: (a: BodyArea) => string
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Exercises matching every active group (AND across groups, OR within one). Pass already-localised exercises. */
export function filterExercises(list: readonly Exercise[], f: ExerciseFilters, ctx: FilterContext): Exercise[] {
  const q = norm(f.query.trim())
  const out = list.filter((e) => {
    if (f.categories.length && !f.categories.includes(e.category)) return false
    if (f.areas.length && !e.bodyAreas.some((a) => f.areas.includes(a))) return false
    if (f.equipment.length) {
      const need = e.equipment ?? []
      if (!f.equipment.some((x) => (x === 'none' ? need.length === 0 : need.includes(x)))) return false
    }
    if (f.perSide !== 'any' && e.perSide !== (f.perSide === 'yes')) return false
    if (f.mode !== 'any' && e.mode !== f.mode) return false
    if (f.favoritesOnly && !ctx.favorites.has(e.id)) return false
    if (f.recentOnly && !ctx.recent.has(e.id)) return false
    if (f.notInSession && ctx.inSession.has(e.id)) return false
    if (f.onlyMyEquipment && !canDo(e, ctx.have)) return false
    if (q) {
      const hay = [e.name, ...e.bodyAreas, ...e.bodyAreas.map(ctx.areaLabel), ...e.instructions].map(norm)
      if (!hay.some((h) => h.includes(q))) return false
    }
    return true
  })
  const byName = (a: Exercise, b: Exercise) => a.name.localeCompare(b.name)
  const cats: Category[] = ['strength', 'stretch', 'mobility']
  if (f.sort === 'category') out.sort((a, b) => cats.indexOf(a.category) - cats.indexOf(b.category) || byName(a, b))
  else if (f.sort === 'area') out.sort((a, b) => (a.bodyAreas[0] ?? '').localeCompare(b.bodyAreas[0] ?? '') || byName(a, b))
  else out.sort(byName)
  return out
}

/** True when any filter other than sort / the equipment default differs from the defaults. */
export const activeFilterCount = (f: ExerciseFilters) =>
  (f.query.trim() ? 1 : 0) + f.categories.length + f.areas.length + f.equipment.length +
  (f.perSide !== 'any' ? 1 : 0) + (f.mode !== 'any' ? 1 : 0) +
  (f.favoritesOnly ? 1 : 0) + (f.recentOnly ? 1 : 0) + (f.notInSession ? 1 : 0)

/** Ids of exercises used in the most recent completed sessions. */
export const recentExerciseIds = (history: readonly { items?: { exerciseId: string }[] }[], maxEntries = 10): Set<string> =>
  new Set(history.slice(0, maxEntries).flatMap((h) => (h.items ?? []).map((i) => i.exerciseId)))
