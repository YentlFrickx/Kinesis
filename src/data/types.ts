import type { Keyframe, Prop } from '../animation/skeleton'

export type Category = 'strength' | 'stretch' | 'mobility'
export type BodyArea = 'glutes' | 'hips' | 'quads' | 'hamstrings' | 'calves' | 'core' | 'full body'

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
