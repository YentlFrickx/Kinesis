import type { Gear, Keyframe, Prop } from '../animation/skeleton'

export type Category = 'strength' | 'stretch' | 'mobility'
export type BodyArea = 'glutes' | 'hips' | 'quads' | 'hamstrings' | 'calves' | 'core' | 'chest' | 'arms' | 'shoulders' | 'upper back' | 'feet' | 'full body'

export type Equipment = 'dumbbell' | 'band'
export const EQUIPMENT: readonly Equipment[] = ['dumbbell', 'band']
export const EQUIPMENT_LABEL: Record<Equipment, string> = { dumbbell: 'Dumbbells', band: 'Resistance band' }

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
  animation: Keyframe[]
  props?: Prop[]
  /** Small equipment needed. Omitted = bodyweight. */
  equipment?: Equipment[]
  /** How the equipment is drawn; every gear kind used must be listed in `equipment`. */
  gear?: Gear[]
}

export interface SessionItem {
  exerciseId: string
  value: number
  sets: number
  restAfterSec?: number
}

export interface Session {
  id: string
  name: string
  items: SessionItem[]
  defaultSetRestSec: number
  defaultTransitionSec: number
}
