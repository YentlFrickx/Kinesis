import type { Gear, Keyframe, Prop } from '../animation/skeleton'

export type Category = 'strength' | 'stretch' | 'mobility'
export type BodyArea = 'glutes' | 'hips' | 'quads' | 'hamstrings' | 'calves' | 'core' | 'chest' | 'arms' | 'shoulders' | 'upper back' | 'feet' | 'full body'

export type Equipment = 'dumbbell' | 'band'
export const EQUIPMENT: readonly Equipment[] = ['dumbbell', 'band']

export interface Exercise {
  id: string
  name: string
  category: Category
  bodyAreas: BodyArea[]
  /** 'time' = hold/work for N seconds, 'reps' = N repetitions. */
  mode: 'time' | 'reps'
  defaultValue: number
  defaultSets: number
  /** Done on each side in turn (left, then right). */
  perSide: boolean
  instructions: string[]
  /** Short "feel it in…" / form cues. */
  cues?: string[]
  commonMistakes?: string[]
  /** Ids of a regression / progression exercise. */
  easier?: string
  harder?: string
  animation: Keyframe[]
  props?: Prop[]
  /** Small equipment needed. Omitted = bodyweight. */
  equipment?: Equipment[]
  /** How the equipment is drawn; every gear kind used must be listed in `equipment`. */
  gear?: Gear[]
  /** Optional gear the exercise can be done with, and how it is drawn then (`[]` = not drawn). Chosen per session item. */
  gearOptions?: Partial<Record<Equipment, Gear[]>>
  /** Set on the derived exercise returned by `withGear`: the gear in use. Appends "with …" to the title. */
  gearUsed?: Equipment
}

export interface SessionItem {
  /** Stable id used as React key; assigned by the sessions store (migrated on load, generated on import). */
  id?: string
  exerciseId: string
  value: number
  sets: number
  restAfterSec?: number
  /** Optional gear modifier (must be one of the exercise's `gearOptions`), e.g. dumbbells on a calf raise. */
  gear?: Equipment
  /** Free-text user note, e.g. "use the 8 kg dumbbell". */
  note?: string
}

export const MAX_NOTE_LENGTH = 200

export interface Session {
  id: string
  name: string
  items: SessionItem[]
  defaultSetRestSec: number
  defaultTransitionSec: number
}
