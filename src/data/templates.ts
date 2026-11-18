import type { Session } from './types'

/**
 * Starter sessions, added once on first launch (and restorable from the
 * Sessions screen). Ids are fixed so they are never added twice.
 */
export const STARTERS: Session[] = [
  {
    id: 'starter-runner-strength',
    name: 'Strength workout (30 min)',
    defaultSetRestSec: 30,
    defaultTransitionSec: 15,
    items: [
      // warm-up
      { exerciseId: 'leg-swings', value: 10, sets: 1 },
      { exerciseId: 'worlds-greatest-stretch', value: 5, sets: 1 },
      { exerciseId: 'glute-bridge', value: 12, sets: 1 },
      { exerciseId: 'single-leg-balance', value: 30, sets: 1 },
      // calves and Achilles
      { exerciseId: 'straight-leg-calf-raise-box', value: 15, sets: 3 },
      { exerciseId: 'bent-knee-calf-raise-box', value: 15, sets: 2 },
      // single-leg strength
      { exerciseId: 'bulgarian-split-squat', value: 8, sets: 3 },
      { exerciseId: 'single-leg-rdl', value: 8, sets: 2 },
      { exerciseId: 'single-leg-glute-bridge', value: 10, sets: 2 },
      { exerciseId: 'step-up', value: 10, sets: 2 },
      // core and upper body
      { exerciseId: 'side-plank', value: 25, sets: 2 },
      { exerciseId: 'dead-bug', value: 10, sets: 2 },
      { exerciseId: 'forearm-plank', value: 40, sets: 2 },
      { exerciseId: 'push-up', value: 10, sets: 2 },
    ],
  },
  {
    id: 'starter-feet-calves-stretch',
    name: 'Feet & calves stretch',
    defaultSetRestSec: 10,
    defaultTransitionSec: 10,
    items: [
      { exerciseId: 'calf-stretch', value: 40, sets: 1 },
      { exerciseId: 'calf-stretch-step', value: 30, sets: 2 },
      { exerciseId: 'toe-extension', value: 30, sets: 2 },
      { exerciseId: 'toe-curls-towel', value: 10, sets: 1 },
      { exerciseId: 'hamstring-stretch', value: 30, sets: 1 },
    ],
  },
]
