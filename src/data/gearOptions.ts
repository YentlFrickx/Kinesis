import type { Gear } from '../animation/skeleton'
import type { Equipment } from './types'

const dumbbells: Gear[] = [{ kind: 'dumbbell', at: 'handF' }, { kind: 'dumbbell', at: 'handB' }]
const dumbbellOnHips: Gear[] = [{ kind: 'dumbbell', at: 'hip' }]
const bandAtKnees: Gear[] = [{ kind: 'band', from: 'kneeB', to: 'kneeF' }]

/** Which exercises can take a gear modifier, and how it is drawn. Merged into the library in exercises.ts. */
export const GEAR_OPTIONS: Record<string, Partial<Record<Equipment, Gear[]>>> = {
  'bodyweight-squat': { dumbbell: dumbbells, band: bandAtKnees },
  'reverse-lunge': { dumbbell: dumbbells },
  'step-up': { dumbbell: dumbbells },
  'side-lunge': { dumbbell: dumbbells },
  'bulgarian-split-squat': { dumbbell: dumbbells },
  'single-leg-rdl': { dumbbell: dumbbells },
  'single-leg-calf-raise': { dumbbell: dumbbells },
  'straight-leg-calf-raise-box': { dumbbell: dumbbells },
  'bent-knee-calf-raise-box': { dumbbell: dumbbells },
  'glute-bridge': { dumbbell: dumbbellOnHips, band: bandAtKnees },
  'single-leg-glute-bridge': { dumbbell: dumbbellOnHips },
  'frog-pump': { dumbbell: dumbbellOnHips },
  'wall-sit': { dumbbell: dumbbellOnHips },
  'clamshell': { band: bandAtKnees },
  'fire-hydrant': { band: bandAtKnees },
  'side-leg-raise': { band: [{ kind: 'band', from: 'ankleB', to: 'ankleF' }] },
}
