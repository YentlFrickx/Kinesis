import { pose } from '../animation/skeleton'
import type { Exercise } from './types'

const bridgeBase = {
  head: [28, 118], neck: [42, 120], hip: [85, 120],
  kneeF: [115, 92], ankleF: [135, 124], toeF: [145, 124],
  kneeB: [118, 92], ankleB: [138, 124], toeB: [148, 124],
  elbowF: [62, 122], handF: [82, 122], elbowB: [62, 122], handB: [82, 122],
} as const

const bridgeUp = {
  ...bridgeBase, hip: [88, 92], kneeF: [118, 88], kneeB: [121, 88],
} as const

const squatArms = { elbowF: [112, 52], handF: [128, 50], elbowB: [112, 52], handB: [128, 50] } as const

const lungeBase = {
  head: [86, 44], neck: [86, 58], hip: [82, 96],
  kneeF: [118, 96], ankleF: [118, 126], toeF: [128, 126],
  kneeB: [80, 124], ankleB: [48, 124], toeB: [40, 124],
  elbowF: [80, 78], handF: [90, 94], elbowB: [80, 78], handB: [90, 94],
} as const

export const EXERCISES: Exercise[] = [
  {
    id: 'glute-bridge', name: 'Glute bridge', category: 'strength',
    bodyAreas: ['glutes', 'hamstrings', 'core'],
    mode: 'reps', defaultValue: 12, defaultSets: 3, perSide: false,
    instructions: [
      'Lie on your back, knees bent, feet flat hip-width apart.',
      'Squeeze your glutes and lift your hips until shoulders, hips and knees form a line.',
      'Pause briefly at the top, then lower with control.',
    ],
    animation: [
      { pose: pose(bridgeBase), ms: 1200 },
      { pose: pose(bridgeUp), ms: 1200 },
    ],
  },
  {
    id: 'bodyweight-squat', name: 'Bodyweight squat', category: 'strength',
    bodyAreas: ['quads', 'glutes'],
    mode: 'reps', defaultValue: 12, defaultSets: 3, perSide: false,
    instructions: [
      'Stand with feet shoulder-width apart, arms forward.',
      'Sit your hips back and down, keeping your chest up and heels on the floor.',
      'Go down until thighs are about parallel, then drive back up.',
    ],
    animation: [
      { pose: pose({ ...squatArms }), ms: 1400 },
      {
        pose: pose({
          head: [106, 52], neck: [100, 66], hip: [76, 98],
          kneeF: [112, 100], kneeB: [112, 100], ...squatArms,
        }),
        ms: 1400,
      },
    ],
  },
  {
    id: 'hip-flexor-stretch', name: 'Kneeling hip flexor stretch', category: 'stretch',
    bodyAreas: ['hips', 'quads'],
    mode: 'time', defaultValue: 30, defaultSets: 1, perSide: true,
    instructions: [
      'Kneel on one knee with the other foot forward, knee over the ankle.',
      'Tuck your pelvis under and shift your weight gently forward.',
      'Feel the stretch at the front of the hip of the kneeling leg. Keep your torso upright.',
    ],
    animation: [
      { pose: pose(lungeBase), ms: 2000 },
      {
        pose: pose({
          ...lungeBase, hip: [96, 98], neck: [97, 60], head: [97, 46],
          kneeB: [94, 124], ankleB: [62, 124], toeB: [54, 124],
        }),
        ms: 2000,
      },
    ],
  },
]
