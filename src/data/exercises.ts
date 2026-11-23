import { pose, type Keyframe, type Pose, type Prop } from '../animation/skeleton'
import { COACHING } from './coaching'
import { GEAR_OPTIONS } from './gearOptions'
import { EQUIPMENT, type Equipment, type Exercise } from './types'

type P = Partial<Pose>

// ---- shared base poses (side view, facing right; floor is y=126) ----
const supine: P = {
  head: [28, 118], neck: [42, 120], hip: [85, 120],
  elbowF: [62, 122], handF: [82, 122], elbowB: [62, 122], handB: [82, 122],
}
const bridgeDown: P = {
  ...supine,
  kneeF: [115, 92], ankleF: [135, 124], toeF: [145, 124],
  kneeB: [118, 92], ankleB: [138, 124], toeB: [148, 124],
}
const handsOnHips: P = { elbowF: [88, 58], handF: [100, 76], elbowB: [88, 58], handB: [100, 76] }
const armsForward: P = { elbowF: [112, 52], handF: [128, 50], elbowB: [112, 52], handB: [128, 50] }
const lunge: P = {
  head: [86, 44], neck: [86, 58], hip: [82, 96],
  kneeF: [118, 96], ankleF: [118, 126], toeF: [128, 126],
  kneeB: [80, 124], ankleB: [48, 124], toeB: [40, 124],
  elbowF: [80, 78], handF: [90, 94], elbowB: [80, 78], handB: [90, 94],
}
const sideLying: P = {
  head: [30, 112], neck: [44, 117], hip: [95, 118],
  elbowF: [48, 100], handF: [34, 110], elbowB: [48, 100], handB: [34, 110],
}
const tabletop: P = {
  ...supine,
  kneeF: [85, 95], ankleF: [110, 95], toeF: [115, 99],
  kneeB: [88, 95], ankleB: [113, 95], toeB: [118, 99],
  elbowF: [44, 100], handF: [46, 80], elbowB: [40, 100], handB: [42, 80],
}
const seated: P = {
  hip: [80, 121], kneeF: [105, 122], ankleF: [130, 122], toeF: [133, 110],
  kneeB: [60, 112], ankleB: [84, 124], toeB: [92, 124],
}
const kneelChild: P = {
  kneeF: [100, 122], ankleF: [74, 124], toeF: [66, 124],
  kneeB: [100, 122], ankleB: [74, 124], toeB: [66, 124],
}
const wgs: P = {
  hip: [82, 100], neck: [108, 72], head: [119, 66],
  kneeF: [118, 98], ankleF: [118, 126], toeF: [128, 126],
  kneeB: [60, 113], ankleB: [38, 124], toeB: [46, 126],
  elbowF: [112, 98], handF: [112, 125], elbowB: [108, 98], handB: [106, 125],
}
const sidePlankUp: P = {
  head: [32, 94], neck: [44, 98], hip: [92, 104],
  kneeF: [114, 114], ankleF: [136, 123], toeF: [142, 125],
  kneeB: [114, 113], ankleB: [136, 122], toeB: [142, 124],
  elbowF: [44, 124], handF: [62, 124], elbowB: [46, 84], handB: [46, 64],
}
// Forearm plank: shoulders over elbows, one straight line from head to heels.
const forearmPlank: P = {
  head: [35, 97], neck: [48, 100], hip: [96, 107],
  kneeF: [123, 113], ankleF: [150, 120], toeF: [156, 125],
  kneeB: [123, 113], ankleB: [150, 120], toeB: [156, 125],
  elbowF: [50, 124], handF: [28, 124], elbowB: [50, 124], handB: [28, 124],
}
// Side-lying leg raise, seen from the front: head on the bottom arm, top hand propped on the floor.
const sideLegDown: P = {
  head: [28, 113], neck: [42, 118], hip: [95, 121],
  elbowB: [30, 123], handB: [18, 123],
  elbowF: [54, 107], handF: [64, 121],
  kneeB: [120, 122], ankleB: [145, 122], toeB: [151, 124],
  kneeF: [120, 119], ankleF: [145, 119], toeF: [151, 121],
}
const swingSupport: P = {
  kneeB: [100, 101], ankleB: [100, 126], toeB: [110, 126],
  elbowF: [114, 56], handF: [128, 54], elbowB: [86, 56], handB: [72, 54],
}
const calfRaiseArms: P = { ...handsOnHips }
const seatedRow: P = {
  head: [82, 70], neck: [80, 84], hip: [80, 120],
  kneeF: [108, 122], ankleF: [136, 122], toeF: [141, 112],
  kneeB: [108, 122], ankleB: [136, 122], toeB: [141, 112],
}
const proneBase: P = {
  hip: [95, 122],
  kneeF: [118, 124], ankleF: [142, 124], toeF: [148, 124],
  kneeB: [118, 124], ankleB: [142, 124], toeB: [148, 124],
}
const quadruped: P = {
  head: [40, 84], neck: [56, 88], hip: [104, 90],
  kneeF: [104, 122], ankleF: [130, 124], toeF: [138, 124],
  kneeB: [106, 122], ankleB: [132, 124], toeB: [140, 124],
  elbowF: [56, 108], handF: [56, 124], elbowB: [58, 108], handB: [58, 124],
}

// ---- helpers for scenes with a box/step (shrink the figure so everything fits) ----
const scalePose = (k: number, p: Pose): Pose => {
  const out = {} as Record<keyof Pose, readonly [number, number]>
  for (const j of Object.keys(p) as (keyof Pose)[]) out[j] = [100 + (p[j][0] - 100) * k, 126 - (126 - p[j][1]) * k]
  return out
}
const scaleFrames = (k: number, frames: Keyframe[]): Keyframe[] => frames.map((f) => ({ ...f, pose: scalePose(k, f.pose) }))
const scaleProps = (k: number, props: Prop[]): Prop[] =>
  props.map((p) => ({ x: 100 + (p.x - 100) * k, y: 126 - (126 - p.y) * k, w: p.w * k, h: p.h * k }))

/** Upright, straight-legged pose centred at x with the hip at hipY. */
const upright = (x: number, hipY: number): P => ({
  head: [x, hipY - 52], neck: [x, hipY - 38], hip: [x, hipY],
  kneeF: [x, hipY + 25], ankleF: [x, hipY + 50], toeF: [x + 10, hipY + 50],
  kneeB: [x, hipY + 25], ankleB: [x, hipY + 50], toeB: [x + 10, hipY + 50],
  elbowF: [x, hipY - 18], handF: [x, hipY], elbowB: [x, hipY - 18], handB: [x, hipY],
})

const BOX_K = 0.8
const boxProps: Prop[] = [{ x: 88, y: 112, w: 55, h: 14 }]
const stepProps: Prop[] = [{ x: 104, y: 110, w: 56, h: 16 }]
const chairProps: Prop[] = [
  { x: 50, y: 52, w: 6, h: 46 }, { x: 50, y: 92, w: 50, h: 6 },
  { x: 52, y: 98, w: 4, h: 28 }, { x: 94, y: 98, w: 4, h: 28 },
]
const seatedFoot: P = {
  head: [74, 40], neck: [74, 54], hip: [74, 90],
  kneeF: [100, 92], kneeB: [100, 92], ankleF: [102, 119], ankleB: [102, 119],
  elbowF: [84, 76], handF: [96, 90], elbowB: [84, 76], handB: [96, 90],
}
const pushupUp: P = {
  head: [37, 84], neck: [50, 86], hip: [100, 104],
  kneeF: [125, 113], ankleF: [150, 122], toeF: [154, 125],
  kneeB: [125, 113], ankleB: [150, 122], toeB: [154, 125],
  elbowF: [50, 105], handF: [50, 124], elbowB: [50, 105], handB: [50, 124],
}

// ---- poses for the Strava-library additions ----
const inclineUp: P = {
  head: [42, 52], neck: [56, 62], hip: [103, 92],
  kneeF: [127, 107], ankleF: [150, 122], toeF: [156, 125],
  kneeB: [127, 107], ankleB: [150, 122], toeB: [156, 125],
  elbowF: [53, 81], handF: [50, 100], elbowB: [53, 81], handB: [50, 100],
}
const inclineDown: P = {
  ...inclineUp, head: [46, 74], neck: [60, 82], hip: [105, 102],
  kneeF: [128, 112], kneeB: [128, 112],
  elbowF: [80, 94], elbowB: [80, 94],
}
const pikeUp: P = {
  head: [64, 100], neck: [72, 92], hip: [104, 76],
  kneeF: [120, 100], ankleF: [136, 124], toeF: [144, 125],
  kneeB: [120, 100], ankleB: [136, 124], toeB: [144, 125],
  elbowF: [64, 108], handF: [58, 124], elbowB: [64, 108], handB: [58, 124],
}
const pikeDown: P = {
  ...pikeUp, head: [60, 114], neck: [70, 104], hip: [102, 82],
  kneeF: [119, 103], kneeB: [119, 103],
  elbowF: [84, 106], elbowB: [84, 106],
}
const bicycleA: P = {
  head: [44, 100], neck: [56, 106], hip: [88, 120],
  elbowF: [60, 92], handF: [50, 96], elbowB: [76, 94], handB: [54, 98],
  kneeF: [100, 96], ankleF: [120, 104], toeF: [126, 102],
  kneeB: [118, 108], ankleB: [146, 104], toeB: [152, 102],
}
const bicycleB: P = {
  ...bicycleA,
  elbowB: [60, 92], handB: [50, 96], elbowF: [76, 94], handF: [54, 98],
  kneeB: [100, 96], ankleB: [120, 104], toeB: [126, 102],
  kneeF: [118, 108], ankleF: [146, 104], toeF: [152, 102],
}
const flutterA: P = {
  head: [34, 110], neck: [48, 115], hip: [85, 120],
  elbowF: [66, 123], handF: [84, 123], elbowB: [66, 123], handB: [84, 123],
  kneeF: [115, 114], ankleF: [145, 108], toeF: [151, 106],
  kneeB: [115, 118], ankleB: [145, 116], toeB: [151, 116],
}
const flutterB: P = {
  ...flutterA,
  kneeF: [115, 118], ankleF: [145, 116], toeF: [151, 116],
  kneeB: [115, 112], ankleB: [145, 100], toeB: [151, 98],
}
const sideLungeDown: P = {
  head: [86, 48], neck: [86, 62], hip: [86, 94],
  kneeF: [112, 102], ankleF: [124, 126], toeF: [134, 126],
  kneeB: [66, 110], ankleB: [48, 126], toeB: [58, 126],
  elbowF: [100, 72], handF: [114, 66], elbowB: [100, 72], handB: [114, 66],
}
const frogDown: P = {
  ...supine,
  kneeF: [108, 104], ankleF: [104, 124], toeF: [112, 125],
  kneeB: [110, 106], ankleB: [106, 124], toeB: [114, 125],
}
const pigeonUp: P = {
  head: [100, 64], neck: [96, 78], hip: [88, 112],
  kneeF: [128, 118], ankleF: [108, 124], toeF: [100, 124],
  kneeB: [58, 121], ankleB: [28, 124], toeB: [20, 124],
  elbowF: [108, 100], handF: [124, 124], elbowB: [108, 100], handB: [124, 124],
}
const pigeonFold: P = {
  ...pigeonUp, head: [130, 106], neck: [118, 98], hip: [90, 112],
  elbowF: [140, 114], handF: [160, 124], elbowB: [140, 114], handB: [160, 124],
}
const threadDown: P = {
  ...quadruped, head: [48, 112], neck: [60, 104],
  elbowF: [46, 122], handF: [28, 124],
}
const lyingHamLow: P = {
  head: [34, 112], neck: [48, 116], hip: [85, 120],
  kneeB: [115, 122], ankleB: [145, 124], toeB: [150, 122],
  kneeF: [105, 98], ankleF: [126, 78], toeF: [124, 70],
  elbowF: [70, 104], handF: [100, 100], elbowB: [70, 104], handB: [100, 100],
}
const lyingHamHigh: P = {
  ...lyingHamLow,
  kneeF: [96, 92], ankleF: [110, 66], toeF: [102, 60],
  handF: [92, 92], handB: [92, 92], elbowF: [68, 102], elbowB: [68, 102],
}

const BASE: Exercise[] = [
  // ---------------- strength ----------------
  {
    id: 'glute-bridge', name: 'Glute bridge', category: 'strength',
    bodyAreas: ['glutes', 'hamstrings', 'core'],
    mode: 'reps', defaultValue: 12, defaultSets: 3, perSide: false,
    instructions: [
      'Lie on your back, knees bent, feet flat and hip-width apart.',
      'Squeeze your glutes and lift your hips until shoulders, hips and knees form a line.',
      'Pause briefly at the top, then lower with control.',
    ],
    animation: [
      { pose: pose(bridgeDown), ms: 1200 },
      { pose: pose({ ...bridgeDown, hip: [88, 92], kneeF: [118, 88], kneeB: [121, 88] }), ms: 1200 },
    ],
  },
  {
    id: 'single-leg-glute-bridge', name: 'Single-leg glute bridge', category: 'strength',
    bodyAreas: ['glutes', 'hamstrings', 'core'],
    mode: 'reps', defaultValue: 10, defaultSets: 3, perSide: true,
    instructions: [
      'Lie on your back with one foot flat and the other leg extended straight.',
      'Drive through the planted heel and lift your hips, keeping them level.',
      'Lower slowly. The working leg is the one with the foot on the floor.',
    ],
    animation: [
      {
        pose: pose({
          ...supine, kneeB: [115, 92], ankleB: [135, 124], toeB: [145, 124],
          kneeF: [107, 102], ankleF: [128, 84], toeF: [136, 82],
        }), ms: 1300,
      },
      {
        pose: pose({
          ...supine, hip: [88, 94], kneeB: [118, 88], ankleB: [136, 124], toeB: [146, 124],
          kneeF: [110, 80], ankleF: [132, 66], toeF: [140, 64],
        }), ms: 1300,
      },
    ],
  },
  {
    id: 'bodyweight-squat', name: 'Air squat', category: 'strength',
    bodyAreas: ['quads', 'glutes'],
    mode: 'reps', defaultValue: 12, defaultSets: 3, perSide: false,
    instructions: [
      'Stand with feet shoulder-width apart, arms forward.',
      'Sit your hips back and down, keeping your chest up and heels on the floor.',
      'Go down until thighs are about parallel, then drive back up.',
    ],
    animation: [
      { pose: pose({ ...armsForward }), ms: 1400 },
      {
        pose: pose({
          head: [106, 52], neck: [100, 66], hip: [76, 98],
          kneeF: [112, 100], kneeB: [112, 100], ...armsForward,
        }), ms: 1400,
      },
    ],
  },
  {
    id: 'reverse-lunge', name: 'Reverse lunge', category: 'strength',
    bodyAreas: ['quads', 'glutes', 'hamstrings'],
    mode: 'reps', defaultValue: 10, defaultSets: 2, perSide: true,
    instructions: [
      'Stand tall with hands on your hips.',
      'Step one leg back and lower until both knees are about 90 degrees.',
      'Push through the front heel to return to standing. Keep your torso upright.',
    ],
    animation: [
      { pose: pose({ ...handsOnHips }), ms: 1300 },
      {
        pose: pose({
          head: [100, 44], neck: [100, 58], hip: [100, 96],
          kneeF: [125, 96], ankleF: [125, 126], toeF: [135, 126],
          kneeB: [95, 122], ankleB: [68, 112], toeB: [78, 124],
          elbowF: [88, 72], handF: [100, 88], elbowB: [88, 72], handB: [100, 88],
        }), ms: 1300,
      },
    ],
  },
  {
    id: 'step-up', name: 'Step-up', category: 'strength',
    bodyAreas: ['quads', 'glutes'],
    mode: 'reps', defaultValue: 10, defaultSets: 2, perSide: true,
    instructions: [
      'Face a sturdy step or bench, one foot fully on top.',
      'Drive through the top foot to stand tall, lifting the other knee.',
      'Lower slowly. The working leg is the one on the step.',
    ],
    props: [{ x: 105, y: 112, w: 48, h: 14 }],
    animation: [
      {
        pose: pose({
          head: [102, 26], neck: [102, 40], hip: [102, 78],
          kneeF: [124, 86], ankleF: [126, 112], toeF: [136, 112],
          kneeB: [100, 102], ankleB: [98, 126], toeB: [108, 126],
          elbowF: [102, 60], handF: [102, 78], elbowB: [102, 60], handB: [102, 78],
        }), ms: 1200,
      },
      {
        pose: pose({
          head: [126, 12], neck: [126, 26], hip: [126, 62],
          kneeF: [126, 87], ankleF: [126, 112], toeF: [136, 112],
          kneeB: [124, 88], ankleB: [112, 100], toeB: [118, 102],
          elbowF: [126, 44], handF: [126, 62], elbowB: [126, 44], handB: [126, 62],
        }), ms: 1200,
      },
    ],
  },
  {
    id: 'single-leg-calf-raise', name: 'Single-leg calf raise', category: 'strength',
    bodyAreas: ['calves'],
    mode: 'reps', defaultValue: 12, defaultSets: 3, perSide: true,
    instructions: [
      'Stand on one foot (use a wall for balance), other foot lifted behind you.',
      'Rise onto the ball of your foot as high as you can.',
      'Lower slowly over about three seconds. Great for Achilles and calf resilience.',
    ],
    animation: [
      {
        pose: pose({ kneeB: [100, 101], ankleB: [78, 104], toeB: [74, 112], ...calfRaiseArms }),
        ms: 1100,
      },
      {
        pose: pose({
          head: [100, 14], neck: [100, 28], hip: [100, 66], kneeF: [100, 91], kneeB: [100, 91],
          ankleF: [100, 115], toeF: [109, 126], ankleB: [78, 94], toeB: [74, 102],
          elbowF: [88, 48], handF: [100, 66], elbowB: [88, 48], handB: [100, 66],
        }),
        ms: 1900,
      },
    ],
  },
  {
    id: 'forearm-plank', name: 'Plank', category: 'strength',
    bodyAreas: ['core'],
    mode: 'time', defaultValue: 30, defaultSets: 2, perSide: false,
    instructions: [
      'Rest on your forearms, elbows under shoulders, body in one straight line.',
      'Brace your abs and squeeze your glutes. Do not let the hips sag or pike.',
      'Breathe steadily and hold.',
    ],
    animation: [
      { pose: pose(forearmPlank), ms: 1800 },
      {
        pose: pose({
          ...forearmPlank, head: [35, 95], neck: [48, 98], hip: [97, 105],
          kneeF: [124, 111], kneeB: [124, 111], ankleF: [151, 119], ankleB: [151, 119],
        }), ms: 1800,
      },
    ],
  },
  {
    id: 'side-plank', name: 'Side plank', category: 'strength',
    bodyAreas: ['core', 'glutes'],
    mode: 'time', defaultValue: 20, defaultSets: 2, perSide: true,
    instructions: [
      'Lie on your side, elbow under your shoulder, legs stacked.',
      'Lift your hips so your body forms a straight line from head to feet.',
      'Hold, keeping hips high and stacked. Top arm points to the ceiling.',
    ],
    animation: [
      {
        pose: pose({
          ...sidePlankUp, hip: [92, 121], kneeF: [114, 123], ankleF: [136, 124], toeF: [142, 125],
          kneeB: [114, 122], ankleB: [136, 123], toeB: [142, 124], neck: [44, 106], head: [32, 104],
        }), ms: 1300,
      },
      { pose: pose(sidePlankUp), ms: 1300 },
    ],
  },
  {
    id: 'clamshell', name: 'Clamshell', category: 'strength',
    bodyAreas: ['glutes', 'hips'],
    mode: 'reps', defaultValue: 15, defaultSets: 2, perSide: true,
    instructions: [
      'Lie on your side, knees bent, heels together.',
      'Keeping your feet touching, lift the top knee without rolling your pelvis back.',
      'Lower with control. Targets the hip stabilisers that keep your knees tracking well.',
    ],
    animation: [
      {
        pose: pose({
          ...sideLying, kneeB: [120, 116], ankleB: [98, 117], toeB: [94, 119],
          kneeF: [120, 114], ankleF: [98, 115], toeF: [94, 117],
        }), ms: 1000,
      },
      {
        pose: pose({
          ...sideLying, kneeB: [120, 116], ankleB: [98, 117], toeB: [94, 119],
          kneeF: [116, 92], ankleF: [98, 114], toeF: [94, 117],
        }), ms: 1000,
      },
    ],
  },
  {
    id: 'side-leg-raise', name: 'Side-lying leg raise', category: 'strength',
    bodyAreas: ['glutes', 'hips'],
    mode: 'reps', defaultValue: 15, defaultSets: 2, perSide: true,
    instructions: [
      'Lie on your side with legs straight and in line with your body.',
      'Raise the top leg to about 45 degrees, toes pointing forward.',
      'Lower slowly without letting your hips roll.',
    ],
    animation: [
      { pose: pose(sideLegDown), ms: 1000 },
      {
        pose: pose({ ...sideLegDown, kneeF: [115, 105], ankleF: [136, 91], toeF: [143, 89] }), ms: 1100,
      },
      {
        pose: pose({ ...sideLegDown, kneeF: [115, 105], ankleF: [136, 91], toeF: [143, 89] }), ms: 400,
      },
    ],
  },
  {
    id: 'single-leg-rdl', name: 'Single-leg Romanian deadlift', category: 'strength',
    bodyAreas: ['hamstrings', 'glutes', 'core'],
    mode: 'reps', defaultValue: 8, defaultSets: 2, perSide: true,
    instructions: [
      'Stand on one leg with a soft knee.',
      'Hinge at the hips, sending the other leg straight back as your torso tips forward.',
      'Keep your back flat, then squeeze the glute to return upright. Standing leg is the working leg.',
    ],
    animation: [
      { pose: pose({ kneeB: [92, 101], ankleB: [78, 116], toeB: [80, 124] }), ms: 1500 },
      {
        pose: pose({
          head: [140, 68], neck: [128, 70], hip: [92, 72],
          kneeF: [94, 98], ankleF: [96, 126], toeF: [106, 126],
          kneeB: [66, 74], ankleB: [42, 76], toeB: [38, 80],
          elbowF: [128, 88], handF: [128, 106], elbowB: [126, 88], handB: [126, 106],
        }), ms: 1500,
      },
    ],
  },
  {
    id: 'dead-bug', name: 'Dead bug', category: 'strength',
    bodyAreas: ['core'],
    mode: 'reps', defaultValue: 10, defaultSets: 2, perSide: false,
    instructions: [
      'Lie on your back, arms up, hips and knees bent at 90 degrees.',
      'Slowly extend the opposite arm and leg while pressing your lower back into the floor.',
      'Return and alternate sides. One rep = one extension on each side.',
    ],
    animation: [
      { pose: pose(tabletop), ms: 900 },
      {
        pose: pose({
          ...tabletop, kneeF: [110, 108], ankleF: [135, 121], toeF: [141, 123],
          elbowB: [28, 121], handB: [10, 121],
        }), ms: 900,
      },
      { pose: pose(tabletop), ms: 900 },
      {
        pose: pose({
          ...tabletop, kneeB: [113, 108], ankleB: [138, 121], toeB: [144, 123],
          elbowF: [30, 119], handF: [12, 119],
        }), ms: 900,
      },
    ],
  },
  // ---------------- stretches ----------------
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
      { pose: pose(lunge), ms: 2000 },
      {
        pose: pose({
          ...lunge, hip: [96, 98], neck: [97, 60], head: [97, 46],
          kneeB: [94, 124], ankleB: [62, 124], toeB: [54, 124],
        }), ms: 2000,
      },
    ],
  },
  {
    id: 'quad-stretch', name: 'Standing quad stretch', category: 'stretch',
    bodyAreas: ['quads', 'hips'],
    mode: 'time', defaultValue: 30, defaultSets: 1, perSide: true,
    instructions: [
      'Stand tall (hold a wall if needed) and bend one knee, grabbing the ankle behind you.',
      'Bring your heel toward your glute with knees close together.',
      'Squeeze the glute and push the hip slightly forward to feel the front of the thigh.',
    ],
    animation: [
      {
        pose: pose({
          kneeB: [97, 101], ankleB: [80, 86], toeB: [76, 92],
          elbowF: [90, 62], handF: [80, 84], elbowB: [112, 50], handB: [126, 46],
        }), ms: 1800,
      },
      {
        pose: pose({
          hip: [102, 76], kneeB: [92, 103], ankleB: [76, 82], toeB: [72, 88],
          elbowF: [88, 62], handF: [78, 82], elbowB: [112, 50], handB: [126, 46],
        }), ms: 1800,
      },
    ],
  },
  {
    id: 'calf-stretch', name: 'Wall calf stretch', category: 'stretch',
    bodyAreas: ['calves'],
    mode: 'time', defaultValue: 30, defaultSets: 1, perSide: true,
    instructions: [
      'Hands on a wall, one leg back with the heel flat and knee straight.',
      'Lean toward the wall until you feel the calf of the back leg stretch.',
      'Bend the back knee slightly to target the lower calf and Achilles.',
    ],
    props: [{ x: 146, y: 10, w: 6, h: 116 }],
    animation: [
      {
        pose: pose({
          head: [120, 40], neck: [113, 52], hip: [95, 84],
          kneeF: [112, 100], ankleF: [118, 126], toeF: [128, 126],
          kneeB: [82, 105], ankleB: [70, 126], toeB: [80, 126],
          elbowF: [128, 56], handF: [145, 56], elbowB: [128, 56], handB: [145, 56],
        }), ms: 2000,
      },
      {
        pose: pose({
          head: [126, 41], neck: [119, 53], hip: [99, 85],
          kneeF: [116, 100], ankleF: [118, 126], toeF: [128, 126],
          kneeB: [86, 106], ankleB: [70, 126], toeB: [80, 126],
          elbowF: [132, 57], handF: [145, 56], elbowB: [132, 57], handB: [145, 56],
        }), ms: 2000,
      },
    ],
  },
  {
    id: 'hamstring-stretch', name: 'Seated hamstring stretch', category: 'stretch',
    bodyAreas: ['hamstrings', 'calves'],
    mode: 'time', defaultValue: 30, defaultSets: 1, perSide: true,
    instructions: [
      'Sit with one leg straight, the other foot tucked in toward your inner thigh.',
      'Keep your back long and hinge forward from the hips toward the straight leg.',
      'Stop when you feel a pull behind the thigh. Do not round your back to reach further.',
    ],
    animation: [
      {
        pose: pose({
          ...seated, neck: [80, 83], head: [82, 69],
          elbowF: [88, 100], handF: [104, 119], elbowB: [88, 100], handB: [104, 119],
        }), ms: 2000,
      },
      {
        pose: pose({
          ...seated, neck: [112, 98], head: [123, 97],
          elbowF: [124, 110], handF: [134, 118], elbowB: [124, 110], handB: [134, 118],
        }), ms: 2000,
      },
    ],
  },
  {
    id: 'figure-4-stretch', name: 'Figure-4 glute stretch', category: 'stretch',
    bodyAreas: ['glutes', 'hips'],
    mode: 'time', defaultValue: 30, defaultSets: 1, perSide: true,
    instructions: [
      'Lie on your back, cross one ankle over the opposite knee to make a figure 4.',
      'Pull the supporting thigh toward your chest, keeping your head down.',
      'Feel the stretch deep in the glute of the crossed leg (piriformis).',
    ],
    animation: [
      {
        pose: pose({
          ...supine, kneeB: [115, 92], ankleB: [135, 124], toeB: [145, 124],
          kneeF: [98, 96], ankleF: [118, 92], toeF: [124, 96],
        }), ms: 2000,
      },
      {
        pose: pose({
          ...supine, elbowF: [66, 104], handF: [86, 94], elbowB: [66, 104], handB: [86, 94],
          kneeB: [105, 80], ankleB: [124, 96], toeB: [128, 102],
          kneeF: [92, 88], ankleF: [108, 78], toeF: [114, 82],
        }), ms: 2000,
      },
    ],
  },
  {
    id: 'butterfly-stretch', name: 'Butterfly (adductor) stretch', category: 'stretch',
    bodyAreas: ['hips'],
    mode: 'time', defaultValue: 30, defaultSets: 1, perSide: false,
    instructions: [
      'Sit tall with the soles of your feet together, knees out to the sides.',
      'Hold your feet and let your knees sink toward the floor.',
      'For more stretch, hinge forward from the hips with a long spine.',
    ],
    animation: [
      {
        pose: pose({
          head: [100, 70], neck: [100, 84], hip: [100, 118],
          kneeF: [134, 108], ankleF: [108, 123], toeF: [112, 123],
          kneeB: [66, 108], ankleB: [92, 123], toeB: [88, 123],
          elbowF: [124, 100], handF: [134, 108], elbowB: [76, 100], handB: [66, 108],
        }), ms: 1800,
      },
      {
        pose: pose({
          head: [100, 70], neck: [100, 84], hip: [100, 118],
          kneeF: [134, 122], ankleF: [108, 123], toeF: [112, 123],
          kneeB: [66, 122], ankleB: [92, 123], toeB: [88, 123],
          elbowF: [124, 112], handF: [134, 121], elbowB: [76, 112], handB: [66, 121],
        }), ms: 1800,
      },
    ],
  },
  {
    id: 'childs-pose', name: "Child's pose", category: 'stretch',
    bodyAreas: ['hips', 'full body'],
    mode: 'time', defaultValue: 30, defaultSets: 1, perSide: false,
    instructions: [
      'Kneel, sit your hips back toward your heels and reach your arms forward.',
      'Rest your forehead down and breathe slowly into your lower back.',
      'Let your hips sink a little further with each exhale.',
    ],
    animation: [
      {
        pose: pose({
          ...kneelChild, hip: [76, 106], neck: [112, 96], head: [124, 100],
          elbowF: [134, 108], handF: [154, 120], elbowB: [134, 108], handB: [154, 120],
        }), ms: 2200,
      },
      {
        pose: pose({
          ...kneelChild, hip: [72, 112], neck: [108, 104], head: [121, 110],
          elbowF: [130, 114], handF: [152, 122], elbowB: [130, 114], handB: [152, 122],
        }), ms: 2200,
      },
    ],
  },
  // ---------------- mobility ----------------
  {
    id: 'worlds-greatest-stretch', name: "World's greatest stretch", category: 'mobility',
    bodyAreas: ['hips', 'hamstrings', 'full body'],
    mode: 'reps', defaultValue: 5, defaultSets: 1, perSide: true,
    instructions: [
      'From a deep lunge, place both hands on the floor inside the front foot.',
      'Rotate your chest toward the front knee and reach the inside arm to the ceiling.',
      'Return the hand to the floor. One rep = down and up.',
    ],
    animation: [
      { pose: pose(wgs), ms: 1500 },
      { pose: pose({ ...wgs, elbowB: [114, 52], handB: [118, 34] }), ms: 1500 },
    ],
  },
  {
    id: 'leg-swings', name: 'Leg swings', category: 'mobility',
    bodyAreas: ['hips', 'hamstrings'],
    mode: 'reps', defaultValue: 10, defaultSets: 1, perSide: true,
    instructions: [
      'Stand tall holding a wall or post for balance.',
      'Swing one leg forward and back in a relaxed, controlled arc.',
      'Gradually increase the range, keeping your torso still. Great before a run.',
    ],
    animation: [
      { pose: pose({ ...swingSupport, kneeF: [88, 98], ankleF: [75, 119], toeF: [81, 125] }), ms: 900 },
      { pose: pose({ ...swingSupport, kneeF: [119, 92], ankleF: [138, 108], toeF: [146, 112] }), ms: 900 },
    ],
  },
  // ---------------- added: balance, split squats, calf/foot work, push-up ----------------
  {
    id: 'single-leg-balance', name: 'Single-leg balance', category: 'strength',
    bodyAreas: ['hips', 'calves', 'core'],
    mode: 'time', defaultValue: 30, defaultSets: 2, perSide: true,
    instructions: [
      'Stand on one leg with a slightly soft knee and lift the other knee to hip height.',
      'Keep your hips level and your gaze on a fixed point. Small wobbles are normal.',
      'Make it harder by closing your eyes or standing on a folded towel or cushion.',
    ],
    animation: [
      {
        pose: pose({
          kneeB: [118, 90], ankleB: [114, 114], toeB: [120, 116],
          elbowF: [108, 56], handF: [120, 62], elbowB: [92, 56], handB: [82, 62],
        }), ms: 1400,
      },
      {
        pose: pose({
          head: [103, 24], neck: [102, 38], hip: [101, 76], kneeF: [101, 101],
          kneeB: [120, 86], ankleB: [116, 110], toeB: [122, 112],
          elbowF: [110, 54], handF: [123, 56], elbowB: [92, 54], handB: [80, 54],
        }), ms: 1400,
      },
    ],
  },
  {
    id: 'bulgarian-split-squat', name: 'Bulgarian split squat', category: 'strength',
    bodyAreas: ['quads', 'glutes', 'hamstrings'],
    mode: 'reps', defaultValue: 8, defaultSets: 3, perSide: true,
    instructions: [
      'Stand a stride in front of a bench and rest the top of your back foot on it.',
      'Lower straight down until the front thigh is about parallel to the floor.',
      'Keep your torso tall and your front heel planted, then drive back up. The front leg is the working leg.',
    ],
    props: [{ x: 15, y: 102, w: 47, h: 24 }],
    animation: [
      {
        pose: pose({
          ...handsOnHips,
          kneeF: [112, 100], ankleF: [116, 126], toeF: [126, 126],
          kneeB: [78, 92], ankleB: [56, 100], toeB: [49, 102],
        }), ms: 1500,
      },
      {
        pose: pose({
          head: [100, 46], neck: [100, 60], hip: [96, 98],
          kneeF: [122, 98], ankleF: [118, 126], toeF: [128, 126],
          kneeB: [72, 112], ankleB: [54, 101], toeB: [47, 103],
          elbowF: [88, 76], handF: [96, 92], elbowB: [88, 76], handB: [96, 92],
        }), ms: 1500,
      },
    ],
  },
  {
    id: 'single-leg-half-squat', name: 'Single-leg half squat', category: 'strength',
    bodyAreas: ['quads', 'glutes', 'core'],
    mode: 'reps', defaultValue: 10, defaultSets: 3, perSide: true,
    instructions: [
      'Stand on one leg with the other leg held out in front, arms forward for balance.',
      'Bend the standing knee to roughly 45 to 60 degrees, hips back, knee tracking over your toes.',
      'Press back up to standing. Do not go deeper than you can control.',
    ],
    animation: [
      {
        pose: pose({
          kneeB: [121, 92], ankleB: [142, 106], toeB: [150, 108], ...armsForward,
        }), ms: 1500,
      },
      {
        pose: pose({
          head: [101, 44], neck: [94, 56], hip: [84, 94],
          kneeF: [110, 100], ankleF: [100, 126], toeF: [110, 126],
          kneeB: [108, 100], ankleB: [132, 108], toeB: [140, 110],
          elbowF: [108, 64], handF: [124, 66], elbowB: [108, 64], handB: [124, 66],
        }), ms: 1500,
      },
    ],
  },
  {
    id: 'straight-leg-calf-raise-box', name: 'Straight-leg calf raise (on box)', category: 'strength',
    bodyAreas: ['calves'],
    mode: 'reps', defaultValue: 15, defaultSets: 3, perSide: false,
    instructions: [
      'Stand with the balls of both feet on the edge of a box or step, heels hanging off. Hold a wall for balance.',
      'Keep your knees straight and rise as high as you can onto your toes.',
      'Lower slowly until your heels drop below the step for a full stretch. Targets the gastrocnemius.',
    ],
    props: scaleProps(BOX_K, boxProps),
    animation: scaleFrames(BOX_K, [
      { pose: pose({ ...upright(88, 70), toeF: [98, 112], toeB: [98, 112], ankleF: [88, 120], ankleB: [88, 120] }), ms: 1800 },
      { pose: pose({ ...upright(89, 48), toeF: [99, 112], toeB: [99, 112], ankleF: [89, 98], ankleB: [89, 98] }), ms: 1200 },
    ]),
  },
  {
    id: 'bent-knee-calf-raise-box', name: 'Bent-knee calf raise (on box)', category: 'strength',
    bodyAreas: ['calves'],
    mode: 'reps', defaultValue: 15, defaultSets: 3, perSide: false,
    instructions: [
      'Stand with the balls of both feet on a box edge and bend your knees slightly, holding a wall for balance.',
      'Keeping the knees bent the whole time, rise onto your toes as high as you can.',
      'Lower slowly below the step. The bent knee shifts the work to the deeper soleus muscle.',
    ],
    props: scaleProps(BOX_K, boxProps),
    animation: scaleFrames(BOX_K, [
      {
        pose: pose({
          head: [86, 22], neck: [86, 36], hip: [84, 74],
          kneeF: [102, 95], kneeB: [102, 95], ankleF: [88, 118], ankleB: [88, 118], toeF: [98, 112], toeB: [98, 112],
          elbowF: [74, 56], handF: [84, 74], elbowB: [74, 56], handB: [84, 74],
        }), ms: 1800,
      },
      {
        pose: pose({
          head: [87, 4], neck: [87, 18], hip: [85, 56],
          kneeF: [103, 77], kneeB: [103, 77], ankleF: [89, 99], ankleB: [89, 99], toeF: [99, 112], toeB: [99, 112],
          elbowF: [75, 38], handF: [85, 56], elbowB: [75, 38], handB: [85, 56],
        }), ms: 1200,
      },
    ]),
  },
  {
    id: 'push-up', name: 'Push-up', category: 'strength',
    bodyAreas: ['chest', 'arms', 'core'],
    mode: 'reps', defaultValue: 10, defaultSets: 3, perSide: false,
    instructions: [
      'Start in a high plank, hands under your shoulders, body in one straight line.',
      'Lower your chest toward the floor with elbows at about 45 degrees from your body.',
      'Press back up without letting your hips sag. Drop to your knees if you need an easier version.',
    ],
    animation: [
      { pose: pose(pushupUp), ms: 1000 },
      {
        pose: pose({
          ...pushupUp, head: [37, 110], neck: [50, 112], hip: [100, 115],
          kneeF: [125, 119], kneeB: [125, 119], ankleF: [150, 123], ankleB: [150, 123],
          elbowF: [68, 106], elbowB: [68, 106],
        }), ms: 1000,
      },
    ],
  },
  {
    id: 'toe-curls-towel', name: 'Toe curls with towel', category: 'strength',
    bodyAreas: ['feet'],
    mode: 'reps', defaultValue: 15, defaultSets: 2, perSide: true,
    instructions: [
      'Sit on a chair with one foot flat on a small towel laid on a smooth floor.',
      'Curl your toes to scrunch the towel toward you, keeping your heel on the floor.',
      'Relax and spread the toes, then repeat. Strengthens the small muscles under the arch.',
    ],
    props: [...chairProps, { x: 96, y: 124, w: 50, h: 2 }],
    animation: [
      { pose: pose({ ...seatedFoot, toeF: [116, 125], toeB: [116, 125] }), ms: 900 },
      { pose: pose({ ...seatedFoot, toeF: [108, 122], toeB: [108, 122] }), ms: 900 },
    ],
  },
  {
    id: 'calf-stretch-step', name: 'Calf stretch on a step', category: 'stretch',
    bodyAreas: ['calves'],
    mode: 'time', defaultValue: 30, defaultSets: 2, perSide: false,
    instructions: [
      'Stand with the balls of your feet on a step and heels hanging off. Hold a rail or wall.',
      'Let your heels sink down below the step until you feel the stretch in your calves and Achilles.',
      'Keep your knees straight. Bend them slightly to shift the stretch lower down to the Achilles.',
    ],
    props: scaleProps(BOX_K, stepProps),
    animation: scaleFrames(BOX_K, [
      { pose: pose({ ...upright(100, 58), toeF: [110, 110], toeB: [110, 110], ankleF: [100, 108], ankleB: [100, 108] }), ms: 1800 },
      { pose: pose({ ...upright(100, 72), toeF: [110, 110], toeB: [110, 110], ankleF: [100, 122], ankleB: [100, 122] }), ms: 1800 },
    ]),
  },
  {
    id: 'toe-extension', name: 'Toe extension', category: 'stretch',
    bodyAreas: ['feet'],
    mode: 'time', defaultValue: 30, defaultSets: 2, perSide: false,
    instructions: [
      'Kneel with your toes tucked under so the soles face behind you.',
      'Slowly sit back toward your heels until you feel the stretch along the bottom of your toes and arches.',
      'Hold, easing off if it is sharp. Lift your hips to release.',
    ],
    animation: [
      {
        pose: pose({
          head: [91, 44], neck: [90, 58], hip: [88, 96],
          kneeF: [98, 122], kneeB: [98, 122], ankleF: [74, 108], ankleB: [74, 108], toeF: [76, 125], toeB: [76, 125],
          elbowF: [92, 80], handF: [98, 112], elbowB: [92, 80], handB: [98, 112],
        }), ms: 2000,
      },
      {
        pose: pose({
          head: [81, 52], neck: [80, 66], hip: [78, 104],
          kneeF: [98, 122], kneeB: [98, 122], ankleF: [74, 108], ankleB: [74, 108], toeF: [76, 125], toeB: [76, 125],
          elbowF: [84, 88], handF: [98, 114], elbowB: [84, 88], handB: [98, 114],
        }), ms: 2000,
      },
    ],
  },
  // ---------------- added: quadruped, wall work, core, spine ----------------
  {
    id: 'bird-dog', name: 'Bird dog', category: 'strength',
    bodyAreas: ['core', 'glutes'],
    mode: 'reps', defaultValue: 8, defaultSets: 2, perSide: false,
    instructions: [
      'Start on hands and knees, wrists under shoulders and knees under hips, back flat.',
      'Reach one arm forward and the opposite leg back until both are in line with your torso.',
      'Pause without rotating the hips or arching your back, then return and switch. One rep = one extension on each side.',
    ],
    animation: [
      { pose: pose(quadruped), ms: 900 },
      {
        pose: pose({
          ...quadruped, elbowB: [38, 88], handB: [18, 86],
          kneeF: [130, 90], ankleF: [158, 90], toeF: [164, 92],
        }), ms: 1300,
      },
      { pose: pose(quadruped), ms: 900 },
      {
        pose: pose({
          ...quadruped, elbowF: [38, 88], handF: [18, 86],
          kneeB: [132, 90], ankleB: [160, 90], toeB: [166, 92],
        }), ms: 1300,
      },
    ],
  },
  {
    id: 'donkey-kick', name: 'Donkey kicks', category: 'strength',
    bodyAreas: ['glutes', 'hamstrings'],
    mode: 'reps', defaultValue: 12, defaultSets: 2, perSide: true,
    instructions: [
      'Start on hands and knees with a flat back and braced core.',
      'Keeping the knee bent at 90 degrees, press the sole of one foot toward the ceiling until the thigh is level with your back.',
      'Squeeze the glute at the top without arching your lower back, then lower with control.',
    ],
    animation: [
      { pose: pose(quadruped), ms: 1000 },
      {
        pose: pose({ ...quadruped, kneeF: [132, 92], ankleF: [136, 66], toeF: [142, 64] }), ms: 1000,
      },
    ],
  },
  {
    id: 'wall-sit', name: 'Wall sit', category: 'strength',
    bodyAreas: ['quads', 'glutes'],
    mode: 'time', defaultValue: 30, defaultSets: 3, perSide: false,
    instructions: [
      'Lean your back flat against a wall and walk your feet out until your knees are bent to about 90 degrees.',
      'Keep your knees over your ankles and your weight through your heels.',
      'Hold, breathing steadily. Slide up a little to make it easier.',
    ],
    props: [{ x: 50, y: 10, w: 6, h: 116 }],
    animation: [
      {
        pose: pose({
          head: [63, 38], neck: [62, 52], hip: [64, 96],
          kneeF: [104, 98], kneeB: [104, 98], ankleF: [104, 126], ankleB: [104, 126],
          elbowF: [76, 78], handF: [90, 94], elbowB: [76, 78], handB: [90, 94],
        }), ms: 1800,
      },
      {
        pose: pose({
          head: [63, 36], neck: [62, 50], hip: [64, 94],
          kneeF: [104, 96], kneeB: [104, 96], ankleF: [104, 126], ankleB: [104, 126],
          elbowF: [76, 76], handF: [90, 92], elbowB: [76, 76], handB: [90, 92],
        }), ms: 1800,
      },
    ],
  },
  {
    id: 'hollow-hold', name: 'Hollow hold', category: 'strength',
    bodyAreas: ['core'],
    mode: 'time', defaultValue: 20, defaultSets: 3, perSide: false,
    instructions: [
      'Lie on your back, arms overhead and legs straight, and press your lower back into the floor.',
      'Lift your shoulders and legs a few centimetres off the floor so your body forms a shallow banana shape.',
      'Hold. Bend your knees or lower your arms to make it easier, and stop if your lower back arches.',
    ],
    animation: [
      {
        pose: pose({
          ...supine, elbowF: [30, 112], handF: [12, 108], elbowB: [30, 112], handB: [12, 108],
          kneeF: [112, 122], ankleF: [138, 124], toeF: [144, 123],
          kneeB: [112, 122], ankleB: [138, 124], toeB: [144, 123],
        }), ms: 1200,
      },
      {
        pose: pose({
          ...supine, head: [38, 104], neck: [48, 110],
          elbowF: [30, 102], handF: [12, 96], elbowB: [30, 102], handB: [12, 96],
          kneeF: [112, 112], ankleF: [138, 104], toeF: [144, 102],
          kneeB: [112, 112], ankleB: [138, 104], toeB: [144, 102],
        }), ms: 1200,
      },
    ],
  },
  {
    id: 'tibialis-raise', name: 'Tibialis raise', category: 'strength',
    bodyAreas: ['calves', 'feet'],
    mode: 'reps', defaultValue: 15, defaultSets: 3, perSide: false,
    instructions: [
      'Lean your back against a wall with your feet about a foot and a half in front of you.',
      'Keeping your heels on the floor, pull your toes up toward your shins as far as you can.',
      'Lower slowly. Strengthens the shin muscles that help absorb impact and ease shin splints.',
    ],
    props: [{ x: 48, y: 10, w: 6, h: 116 }],
    animation: [
      {
        pose: pose({
          head: [62, 32], neck: [64, 46], hip: [70, 84],
          kneeF: [84, 106], kneeB: [84, 106], ankleF: [96, 126], ankleB: [96, 126],
          toeF: [108, 126], toeB: [108, 126],
          elbowF: [68, 66], handF: [66, 84], elbowB: [68, 66], handB: [66, 84],
        }), ms: 1100,
      },
      {
        pose: pose({
          head: [62, 32], neck: [64, 46], hip: [70, 84],
          kneeF: [84, 106], kneeB: [84, 106], ankleF: [96, 126], ankleB: [96, 126],
          toeF: [106, 108], toeB: [106, 108],
          elbowF: [68, 66], handF: [66, 84], elbowB: [68, 66], handB: [66, 84],
        }), ms: 1100,
      },
    ],
  },
  // ---------------- added: mobility and stretches ----------------
  {
    id: 'cat-cow', name: 'Cat-cow', category: 'mobility',
    bodyAreas: ['core', 'full body'],
    mode: 'reps', defaultValue: 10, defaultSets: 1, perSide: false,
    instructions: [
      'Start on hands and knees, wrists under shoulders and knees under hips.',
      'Cow: breathe in, drop your belly and lift your chest and tailbone.',
      'Cat: breathe out, round your spine toward the ceiling and tuck your chin. One rep = cow then cat.',
    ],
    animation: [
      { pose: pose({ ...quadruped, head: [42, 76], neck: [56, 84], hip: [104, 94] }), ms: 1800 },
      { pose: pose({ ...quadruped, head: [44, 104], neck: [56, 94], hip: [104, 86] }), ms: 1800 },
    ],
  },
  {
    id: 'cobra-stretch', name: 'Cobra stretch', category: 'stretch',
    bodyAreas: ['core', 'hips'],
    mode: 'time', defaultValue: 20, defaultSets: 2, perSide: false,
    instructions: [
      'Lie face down with your hands under your shoulders and legs relaxed behind you.',
      'Press through your hands to lift your chest while your hips stay on the floor.',
      'Keep your shoulders away from your ears and stop where it feels comfortable, with no pinching in the lower back.',
    ],
    animation: [
      {
        pose: pose({
          head: [28, 118], neck: [42, 120], hip: [95, 122],
          kneeF: [118, 124], ankleF: [142, 124], toeF: [148, 124],
          kneeB: [118, 124], ankleB: [142, 124], toeB: [148, 124],
          elbowF: [50, 114], handF: [44, 124], elbowB: [50, 114], handB: [44, 124],
        }), ms: 2000,
      },
      {
        pose: pose({
          head: [46, 90], neck: [58, 100], hip: [96, 122],
          kneeF: [118, 124], ankleF: [142, 124], toeF: [148, 124],
          kneeB: [118, 124], ankleB: [142, 124], toeB: [148, 124],
          elbowF: [64, 112], handF: [60, 124], elbowB: [64, 112], handB: [60, 124],
        }), ms: 2000,
      },
    ],
  },
  {
    id: 'knee-to-chest-stretch', name: 'Knee-to-chest stretch', category: 'stretch',
    bodyAreas: ['glutes', 'hips'],
    mode: 'time', defaultValue: 30, defaultSets: 1, perSide: true,
    instructions: [
      'Lie on your back with one leg straight on the floor.',
      'Hug the other knee toward your chest with both hands, keeping your head and lower back down.',
      'Hold and breathe. You should feel it in the glute and lower back of the hugged leg.',
    ],
    animation: [
      {
        pose: pose({
          ...supine, kneeB: [115, 122], ankleB: [145, 123], toeB: [151, 121],
          kneeF: [105, 94], ankleF: [122, 110], toeF: [126, 114],
          elbowF: [74, 106], handF: [100, 96], elbowB: [74, 106], handB: [100, 96],
        }), ms: 2000,
      },
      {
        pose: pose({
          ...supine, kneeB: [115, 122], ankleB: [145, 123], toeB: [151, 121],
          kneeF: [70, 98], ankleF: [90, 106], toeF: [94, 110],
          elbowF: [62, 108], handF: [76, 100], elbowB: [62, 108], handB: [76, 100],
        }), ms: 2000,
      },
    ],
  },
  // ---------------- added: triathlon (swim shoulders, aero/bike posture, run hips) ----------------
  {
    id: 'prone-y-raise', name: 'Prone Y raise', category: 'strength',
    bodyAreas: ['shoulders', 'upper back'],
    mode: 'reps', defaultValue: 10, defaultSets: 2, perSide: false,
    instructions: [
      'Lie face down with your arms overhead in a Y shape, thumbs pointing up and forehead hovering just off the floor.',
      'Pull your shoulder blades back and down, then lift both arms a few centimetres without shrugging.',
      "Lower slowly. Builds the shoulder-blade stability that protects a swimmer's shoulders.",
    ],
    animation: [
      {
        pose: pose({
          ...proneBase, head: [28, 119], neck: [42, 121],
          elbowF: [24, 122], handF: [8, 124], elbowB: [24, 122], handB: [8, 124],
        }), ms: 1200,
      },
      {
        pose: pose({
          ...proneBase, head: [30, 108], neck: [44, 114],
          elbowF: [26, 104], handF: [8, 98], elbowB: [26, 104], handB: [8, 98],
        }), ms: 1200,
      },
    ],
  },
  {
    id: 'prone-w-raise', name: 'Prone W raise', category: 'strength',
    bodyAreas: ['shoulders', 'upper back'],
    mode: 'reps', defaultValue: 10, defaultSets: 2, perSide: false,
    instructions: [
      'Lie face down with your elbows bent and tucked by your ribs, hands near your head in a W shape.',
      'Squeeze your shoulder blades together and lift your elbows and hands off the floor, rotating the arms outward.',
      'Pause, then lower slowly. Targets the rotator cuff and mid-back used in the swim catch.',
    ],
    animation: [
      {
        pose: pose({
          ...proneBase, head: [28, 119], neck: [42, 121],
          elbowF: [58, 124], handF: [38, 124], elbowB: [58, 124], handB: [38, 124],
        }), ms: 1200,
      },
      {
        pose: pose({
          ...proneBase, head: [30, 108], neck: [44, 114],
          elbowF: [58, 110], handF: [38, 104], elbowB: [58, 110], handB: [38, 104],
        }), ms: 1200,
      },
    ],
  },
  {
    id: 'thoracic-rotation', name: 'Thoracic rotation', category: 'mobility',
    bodyAreas: ['upper back', 'shoulders'],
    mode: 'reps', defaultValue: 8, defaultSets: 1, perSide: true,
    instructions: [
      'Start on hands and knees and place one hand behind your head, elbow pointing down.',
      'Rotate your chest and lift that elbow toward the ceiling, following it with your eyes. Keep your hips square.',
      'Return the elbow toward the opposite arm. Counteracts a stiff upper back from the bike and aids swim rotation.',
    ],
    animation: [
      { pose: pose({ ...quadruped, elbowB: [60, 104], handB: [44, 88] }), ms: 1400 },
      { pose: pose({ ...quadruped, head: [38, 80], elbowB: [58, 66], handB: [44, 82] }), ms: 1400 },
    ],
  },
  {
    id: 'wall-angel', name: 'Wall angel', category: 'mobility',
    bodyAreas: ['upper back', 'shoulders'],
    mode: 'reps', defaultValue: 10, defaultSets: 2, perSide: false,
    instructions: [
      'Stand with your back, head and hips against a wall and your feet a short step out. Arms bent beside you.',
      'Slide your arms up the wall overhead without letting your ribs flare or your lower back arch.',
      'Slide back down with control. Opens the chest and upper back after time in the aero position.',
    ],
    props: [{ x: 50, y: 10, w: 6, h: 116 }],
    animation: [
      {
        pose: pose({
          head: [62, 28], neck: [62, 42], hip: [64, 80],
          kneeF: [74, 103], kneeB: [74, 103], ankleF: [84, 126], ankleB: [84, 126],
          toeF: [94, 126], toeB: [94, 126],
          elbowF: [68, 58], handF: [64, 42], elbowB: [68, 58], handB: [64, 42],
        }), ms: 1600,
      },
      {
        pose: pose({
          head: [62, 28], neck: [62, 42], hip: [64, 80],
          kneeF: [74, 103], kneeB: [74, 103], ankleF: [84, 126], ankleB: [84, 126],
          toeF: [94, 126], toeB: [94, 126],
          elbowF: [64, 22], handF: [62, 2], elbowB: [64, 22], handB: [62, 2],
        }), ms: 1600,
      },
    ],
  },
  {
    id: 'couch-stretch', name: 'Couch stretch', category: 'stretch',
    bodyAreas: ['quads', 'hips'],
    mode: 'time', defaultValue: 45, defaultSets: 1, perSide: true,
    instructions: [
      'Kneel with the shin of your back leg up the wall (or on a couch) and your other foot planted in front.',
      'Squeeze the glute of the back leg and rise to an upright torso until you feel the front of the thigh and hip stretch.',
      'Hold and breathe. Counters tight hip flexors from long rides and swim kicking. Use a cushion under the knee.',
    ],
    props: [{ x: 20, y: 10, w: 6, h: 116 }],
    animation: [
      {
        pose: pose({
          head: [58, 40], neck: [58, 54], hip: [56, 96],
          kneeB: [34, 124], ankleB: [29, 92], toeB: [28, 86],
          kneeF: [92, 100], ankleF: [92, 126], toeF: [102, 126],
          elbowF: [70, 78], handF: [88, 98], elbowB: [70, 78], handB: [88, 98],
        }), ms: 2000,
      },
      {
        pose: pose({
          head: [64, 42], neck: [64, 56], hip: [62, 100],
          kneeB: [34, 124], ankleB: [29, 92], toeB: [28, 86],
          kneeF: [94, 100], ankleF: [94, 126], toeF: [104, 126],
          elbowF: [76, 80], handF: [90, 98], elbowB: [76, 80], handB: [90, 98],
        }), ms: 2000,
      },
    ],
  },
  // ---------------- added: small equipment ----------------
  {
    id: 'seated-band-row', name: 'Seated band row', category: 'strength',
    bodyAreas: ['upper back', 'arms'],
    mode: 'reps', defaultValue: 12, defaultSets: 3, perSide: false,
    equipment: ['band'],
    gear: [{ kind: 'band', from: 'toeF', to: 'handF' }],
    instructions: [
      'Sit tall with your legs straight and loop a resistance band around the soles of your feet, holding an end in each hand.',
      'Squeeze your shoulder blades together and pull your elbows back past your ribs. Keep your chest up and do not lean back.',
      'Return slowly with control. Builds the pulling muscles that support swimming and an upright riding posture.',
    ],
    animation: [
      {
        pose: pose({ ...seatedRow, elbowF: [100, 92], handF: [118, 102], elbowB: [100, 92], handB: [118, 102] }), ms: 1200,
      },
      {
        pose: pose({ ...seatedRow, elbowF: [64, 98], handF: [88, 100], elbowB: [64, 98], handB: [88, 100] }), ms: 1200,
      },
    ],
  },
  {
    id: 'goblet-squat', name: 'Goblet squat', category: 'strength',
    bodyAreas: ['quads', 'glutes', 'core'],
    mode: 'reps', defaultValue: 10, defaultSets: 3, perSide: false,
    equipment: ['dumbbell'],
    gear: [{ kind: 'dumbbell', at: 'handF' }],
    instructions: [
      'Stand with feet shoulder-width apart, holding one dumbbell vertically against your chest with both hands.',
      'Sit your hips back and down, keeping your chest tall and elbows inside your knees, until your thighs are about parallel.',
      'Drive through your heels to stand. The weight in front helps you stay upright.',
    ],
    animation: [
      {
        pose: pose({ elbowF: [98, 68], handF: [108, 58], elbowB: [98, 68], handB: [108, 58] }), ms: 1500,
      },
      {
        pose: pose({
          head: [106, 52], neck: [100, 66], hip: [76, 98],
          kneeF: [112, 100], kneeB: [112, 100],
          elbowF: [96, 90], handF: [110, 78], elbowB: [96, 90], handB: [110, 78],
        }), ms: 1500,
      },
    ],
  },
  // ---- band ----
  {
    id: 'standing-band-kickback', name: 'Standing band kickback', category: 'strength',
    bodyAreas: ['glutes', 'hamstrings'],
    mode: 'reps', defaultValue: 12, defaultSets: 2, perSide: true,
    equipment: ['band'],
    gear: [{ kind: 'band', from: 'ankleB', to: [170, 100] }],
    instructions: [
      'Loop a band around one ankle and anchor the other end low in front of you, such as a door anchor or sturdy furniture. Hold a wall for balance.',
      'Keeping your torso upright, press the banded leg straight back by squeezing your glute. Do not arch your lower back.',
      'Return slowly against the band. The working leg is the one with the band.',
    ],
    animation: [
      { pose: pose({ kneeB: [104, 101], ankleB: [108, 122], toeB: [116, 124], ...handsOnHips }), ms: 1100 },
      { pose: pose({ kneeB: [92, 102], ankleB: [66, 106], toeB: [60, 110], ...handsOnHips }), ms: 1100 },
    ],
  },
  {
    id: 'band-straight-arm-pulldown', name: 'Band straight-arm pulldown', category: 'strength',
    bodyAreas: ['upper back', 'shoulders'],
    mode: 'reps', defaultValue: 12, defaultSets: 3, perSide: false,
    equipment: ['band'],
    gear: [{ kind: 'band', from: 'handF', to: [160, 2] }],
    instructions: [
      'Anchor a band high in front of you, such as over a door. Stand tall holding the band with both hands and arms straight, reaching forward and up.',
      'Keeping your arms straight, sweep them down toward your thighs by squeezing your lats. Keep your ribs down.',
      'Return slowly. Mimics the pull phase of freestyle swimming.',
    ],
    animation: [
      { pose: pose({ elbowF: [118, 26], handF: [136, 14], elbowB: [118, 26], handB: [136, 14] }), ms: 1300 },
      { pose: pose({ elbowF: [102, 58], handF: [104, 77], elbowB: [102, 58], handB: [104, 77] }), ms: 1300 },
    ],
  },
  {
    id: 'banded-clamshell', name: 'Banded clamshell', category: 'strength',
    bodyAreas: ['glutes', 'hips'],
    mode: 'reps', defaultValue: 15, defaultSets: 2, perSide: true,
    equipment: ['band'],
    gear: [{ kind: 'band', from: 'kneeB', to: 'kneeF' }],
    instructions: [
      'Lie on your side with a small loop band just above your knees, knees bent and heels together.',
      'Keeping your feet touching, lift the top knee against the band without rolling your pelvis back.',
      'Lower with control. A harder version of the clamshell for the hip stabilisers.',
    ],
    animation: [
      {
        pose: pose({
          ...sideLying, kneeB: [120, 116], ankleB: [98, 117], toeB: [94, 119],
          kneeF: [120, 114], ankleF: [98, 115], toeF: [94, 117],
        }), ms: 1000,
      },
      {
        pose: pose({
          ...sideLying, kneeB: [120, 116], ankleB: [98, 117], toeB: [94, 119],
          kneeF: [116, 92], ankleF: [98, 114], toeF: [94, 117],
        }), ms: 1000,
      },
    ],
  },
  {
    id: 'band-pull-through', name: 'Band pull-through', category: 'strength',
    bodyAreas: ['glutes', 'hamstrings'],
    mode: 'reps', defaultValue: 12, defaultSets: 3, perSide: false,
    equipment: ['band'],
    gear: [{ kind: 'band', from: 'handF', to: [8, 116] }],
    instructions: [
      'Anchor a band low behind you. Face away from it, straddle the band and hold it with both hands between your legs.',
      'Hinge at the hips, pushing them back with a flat back and soft knees, letting the band pull your hands through your legs.',
      'Drive your hips forward and squeeze your glutes to stand tall. Teaches the hip hinge with a load.',
    ],
    animation: [
      {
        pose: pose({
          head: [131, 52], neck: [118, 58], hip: [84, 78],
          kneeF: [96, 100], kneeB: [96, 100], ankleF: [98, 126], ankleB: [98, 126],
          elbowF: [104, 82], handF: [90, 98], elbowB: [104, 82], handB: [90, 98],
        }), ms: 1500,
      },
      { pose: pose({ elbowF: [102, 58], handF: [100, 78], elbowB: [102, 58], handB: [100, 78] }), ms: 1500 },
    ],
  },
  {
    id: 'banded-ankle-dorsiflexion', name: 'Banded ankle dorsiflexion', category: 'strength',
    bodyAreas: ['calves', 'feet'],
    mode: 'reps', defaultValue: 15, defaultSets: 2, perSide: true,
    equipment: ['band'],
    gear: [{ kind: 'band', from: 'toeF', to: [192, 122] }],
    instructions: [
      'Sit on the floor with one leg straight and a band looped around the top of that foot, anchored on something sturdy in front of you.',
      'Pull your toes toward your shin against the band, keeping your heel down and your knee straight.',
      'Release slowly. Strengthens the shin muscles that help with shin splints and foot strike.',
    ],
    animation: [
      {
        pose: pose({
          ...seatedRow, neck: [78, 86], head: [80, 72],
          elbowF: [66, 104], handF: [62, 122], elbowB: [66, 104], handB: [62, 122],
          toeF: [146, 124], toeB: [146, 124],
        }), ms: 1100,
      },
      {
        pose: pose({
          ...seatedRow, neck: [78, 86], head: [80, 72],
          elbowF: [66, 104], handF: [62, 122], elbowB: [66, 104], handB: [62, 122],
          toeF: [138, 108], toeB: [138, 108],
        }), ms: 1100,
      },
    ],
  },
  {
    id: 'seated-band-calf-press', name: 'Seated band calf press', category: 'strength',
    bodyAreas: ['calves', 'feet'],
    mode: 'reps', defaultValue: 15, defaultSets: 3, perSide: true,
    equipment: ['band'],
    gear: [{ kind: 'band', from: 'handF', to: 'toeF' }],
    instructions: [
      'Sit with one leg straight, a band looped around the ball of that foot and an end in each hand.',
      'Press your foot away like pushing a gas pedal until your toes point, keeping your knee straight.',
      'Return slowly against the band. Builds calf and Achilles strength without any load on the joints.',
    ],
    animation: [
      {
        pose: pose({
          ...seatedRow, elbowF: [96, 98], handF: [112, 104], elbowB: [96, 98], handB: [112, 104],
          toeF: [138, 108], toeB: [138, 108],
        }), ms: 1000,
      },
      {
        pose: pose({
          ...seatedRow, elbowF: [96, 98], handF: [112, 104], elbowB: [96, 98], handB: [112, 104],
          toeF: [146, 124], toeB: [146, 124],
        }), ms: 1600,
      },
    ],
  },
  // ---- dumbbell ----
  {
    id: 'dumbbell-rdl', name: 'Dumbbell Romanian deadlift', category: 'strength',
    bodyAreas: ['hamstrings', 'glutes', 'core'],
    mode: 'reps', defaultValue: 10, defaultSets: 3, perSide: false,
    equipment: ['dumbbell'],
    gear: [{ kind: 'dumbbell', at: 'handF' }],
    instructions: [
      'Stand tall holding a dumbbell in each hand in front of your thighs, feet hip-width apart.',
      'Push your hips back with soft knees and a flat back, sliding the weights down your thighs to mid-shin.',
      'Squeeze your glutes to stand tall. Keep the weights close to your legs throughout.',
    ],
    animation: [
      { pose: pose({ elbowF: [102, 58], handF: [106, 78], elbowB: [102, 58], handB: [106, 78] }), ms: 1500 },
      {
        pose: pose({
          head: [131, 63], neck: [120, 66], hip: [84, 76],
          kneeF: [96, 100], kneeB: [96, 100], ankleF: [98, 126], ankleB: [98, 126],
          elbowF: [118, 86], handF: [116, 106], elbowB: [118, 86], handB: [116, 106],
        }), ms: 1500,
      },
    ],
  },
  {
    id: 'bent-over-dumbbell-row', name: 'Bent-over dumbbell row', category: 'strength',
    bodyAreas: ['upper back', 'arms'],
    mode: 'reps', defaultValue: 10, defaultSets: 3, perSide: false,
    equipment: ['dumbbell'],
    gear: [{ kind: 'dumbbell', at: 'handF' }],
    instructions: [
      'Hinge forward at the hips with a flat back and soft knees, holding a dumbbell in each hand with arms hanging.',
      'Row the weights toward your hips by driving your elbows back and squeezing your shoulder blades.',
      'Lower slowly. Keep your torso still and your neck neutral.',
    ],
    animation: [
      {
        pose: pose({
          head: [133, 58], neck: [122, 62], hip: [84, 78],
          kneeF: [96, 102], kneeB: [96, 102], ankleF: [98, 126], ankleB: [98, 126],
          elbowF: [122, 84], handF: [120, 104], elbowB: [122, 84], handB: [120, 104],
        }), ms: 1200,
      },
      {
        pose: pose({
          head: [133, 58], neck: [122, 62], hip: [84, 78],
          kneeF: [96, 102], kneeB: [96, 102], ankleF: [98, 126], ankleB: [98, 126],
          elbowF: [103, 72], handF: [116, 84], elbowB: [103, 72], handB: [116, 84],
        }), ms: 1200,
      },
    ],
  },
  {
    id: 'dumbbell-single-leg-calf-raise', name: 'Loaded single-leg calf raise', category: 'strength',
    bodyAreas: ['calves'],
    mode: 'reps', defaultValue: 10, defaultSets: 3, perSide: true,
    equipment: ['dumbbell'],
    gear: [{ kind: 'dumbbell', at: 'handF' }],
    instructions: [
      'Stand on one foot holding a dumbbell in the same-side hand (the other hand on a wall), the other foot lifted behind you.',
      'Rise onto the ball of your foot as high as you can.',
      'Lower slowly over about three seconds. Progress from bodyweight calf raises once those feel easy.',
    ],
    animation: [
      { pose: pose({ kneeB: [100, 101], ankleB: [78, 104], toeB: [74, 112] }), ms: 1100 },
      {
        pose: pose({
          head: [100, 14], neck: [100, 28], hip: [100, 66], kneeF: [100, 91], kneeB: [100, 91],
          ankleF: [100, 115], toeF: [109, 126], ankleB: [78, 94], toeB: [74, 102],
          elbowF: [102, 47], handF: [102, 66], elbowB: [102, 47], handB: [102, 66],
        }), ms: 1900,
      },
    ],
  },
  {
    id: 'dumbbell-reverse-lunge', name: 'Dumbbell reverse lunge', category: 'strength',
    bodyAreas: ['quads', 'glutes', 'hamstrings'],
    mode: 'reps', defaultValue: 10, defaultSets: 3, perSide: true,
    equipment: ['dumbbell'],
    gear: [{ kind: 'dumbbell', at: 'handF' }],
    instructions: [
      'Stand tall holding a dumbbell in each hand at your sides.',
      'Step one leg back and lower until both knees are about 90 degrees, keeping your torso upright.',
      'Push through the front heel to return to standing. Progress from bodyweight lunges once those feel easy.',
    ],
    animation: [
      { pose: pose({}), ms: 1300 },
      {
        pose: pose({
          head: [100, 44], neck: [100, 58], hip: [100, 96],
          kneeF: [125, 96], ankleF: [125, 126], toeF: [135, 126],
          kneeB: [95, 122], ankleB: [68, 112], toeB: [78, 124],
          elbowF: [102, 78], handF: [102, 96], elbowB: [102, 78], handB: [102, 96],
        }), ms: 1300,
      },
    ],
  },
  // ---------------- added: strength ----------------
  {
    id: 'superman', name: 'Superman', category: 'strength',
    bodyAreas: ['glutes', 'upper back'],
    mode: 'reps', defaultValue: 10, defaultSets: 2, perSide: false,
    instructions: [
      'Lie face down with your arms extended overhead and your legs straight.',
      'Lift your arms, chest and legs a few centimetres off the floor together, keeping your neck long.',
      'Squeeze your glutes and back for a second, then lower with control.',
    ],
    animation: [
      {
        pose: pose({
          ...proneBase, head: [28, 119], neck: [42, 121],
          elbowF: [24, 122], handF: [8, 124], elbowB: [24, 122], handB: [8, 124],
        }), ms: 1300,
      },
      {
        pose: pose({
          ...proneBase, head: [30, 106], neck: [44, 113],
          elbowF: [26, 102], handF: [8, 96], elbowB: [26, 102], handB: [8, 96],
          kneeF: [118, 114], ankleF: [142, 106], toeF: [148, 104],
          kneeB: [118, 114], ankleB: [142, 106], toeB: [148, 104],
        }), ms: 1300,
      },
    ],
  },
  {
    id: 'fire-hydrant', name: 'Fire hydrants', category: 'strength',
    bodyAreas: ['glutes', 'hips'],
    mode: 'reps', defaultValue: 12, defaultSets: 2, perSide: true,
    instructions: [
      'Start on hands and knees with a flat back and braced core.',
      'Keeping the knee bent at 90 degrees, lift one knee out to the side without rotating your pelvis.',
      'Pause at the top, then lower with control. Targets the outer glute and hip stabilisers.',
    ],
    animation: [
      { pose: pose(quadruped), ms: 1000 },
      { pose: pose({ ...quadruped, kneeF: [112, 100], ankleF: [126, 112], toeF: [134, 114] }), ms: 1000 },
    ],
  },
  {
    id: 'glute-bridge-march', name: 'Glute bridge march', category: 'strength',
    bodyAreas: ['glutes', 'core', 'hamstrings'],
    mode: 'reps', defaultValue: 10, defaultSets: 2, perSide: false,
    instructions: [
      'Lie on your back with knees bent and lift into a glute bridge.',
      'Holding the hips level, lift one foot off the floor and bring the knee toward your chest.',
      'Place it back down and switch. One rep = one lift on each side.',
    ],
    animation: [
      { pose: pose({ ...bridgeDown, hip: [88, 96], neck: [46, 108], head: [32, 112] }), ms: 900 },
      {
        pose: pose({
          ...bridgeDown, hip: [88, 96], neck: [46, 108], head: [32, 112],
          kneeF: [100, 76], ankleF: [120, 88], toeF: [128, 92],
        }), ms: 900,
      },
      { pose: pose({ ...bridgeDown, hip: [88, 96], neck: [46, 108], head: [32, 112] }), ms: 900 },
      {
        pose: pose({
          ...bridgeDown, hip: [88, 96], neck: [46, 108], head: [32, 112],
          kneeB: [102, 76], ankleB: [122, 88], toeB: [130, 92],
        }), ms: 900,
      },
    ],
  },
  {
    id: 'lying-leg-raise', name: 'Lying straight leg raise', category: 'strength',
    bodyAreas: ['core', 'hips'],
    mode: 'reps', defaultValue: 10, defaultSets: 2, perSide: false,
    instructions: [
      'Lie on your back with legs straight and hands under your hips; press your lower back into the floor.',
      'Raise both legs together until they point at the ceiling.',
      'Lower slowly, stopping before your back arches. Bend the knees if that is too hard.',
    ],
    animation: [
      {
        pose: pose({
          ...supine, kneeF: [112, 121], ankleF: [140, 122], toeF: [146, 119],
          kneeB: [112, 121], ankleB: [140, 122], toeB: [146, 119],
        }), ms: 1500,
      },
      {
        pose: pose({
          ...supine, kneeF: [88, 94], ankleF: [90, 66], toeF: [100, 64],
          kneeB: [88, 94], ankleB: [90, 66], toeB: [100, 64],
        }), ms: 1500,
      },
    ],
  },
  {
    id: 'plank-shoulder-tap', name: 'Plank shoulder tap', category: 'strength',
    bodyAreas: ['core', 'shoulders'],
    mode: 'reps', defaultValue: 10, defaultSets: 2, perSide: false,
    instructions: [
      'Start in a high plank with hands under shoulders and feet slightly wider than hip width.',
      'Tap one hand to the opposite shoulder while keeping your hips from rocking.',
      'Return and alternate. One rep = one tap on each side.',
    ],
    animation: [
      { pose: pose(pushupUp), ms: 800 },
      { pose: pose({ ...pushupUp, elbowB: [60, 98], handB: [54, 90] }), ms: 800 },
      { pose: pose(pushupUp), ms: 800 },
      { pose: pose({ ...pushupUp, elbowF: [60, 98], handF: [54, 90] }), ms: 800 },
    ],
  },
  {
    id: 'mountain-climber', name: 'Mountain climber', category: 'strength',
    bodyAreas: ['core', 'hips', 'full body'],
    mode: 'time', defaultValue: 30, defaultSets: 2, perSide: false,
    instructions: [
      'Start in a high plank with your shoulders over your wrists and your body in one line.',
      'Drive one knee toward your chest, then switch legs in a running motion.',
      'Keep your hips low and your core braced. Slow down if your form slips.',
    ],
    animation: [
      { pose: pose(pushupUp), ms: 450 },
      { pose: pose({ ...pushupUp, kneeF: [78, 100], ankleF: [96, 118], toeF: [102, 122] }), ms: 450 },
      { pose: pose(pushupUp), ms: 450 },
      { pose: pose({ ...pushupUp, kneeB: [80, 100], ankleB: [98, 118], toeB: [104, 122] }), ms: 450 },
    ],
  },
  {
    id: 'good-morning', name: 'Good morning', category: 'strength',
    bodyAreas: ['hamstrings', 'glutes', 'upper back'],
    mode: 'reps', defaultValue: 12, defaultSets: 2, perSide: false,
    instructions: [
      'Stand with feet hip-width apart, knees soft and hands behind your head.',
      'Push your hips back and hinge forward with a flat back until you feel your hamstrings load.',
      'Drive your hips forward to stand tall again. The hinge comes from the hips, not the spine.',
    ],
    animation: [
      {
        pose: pose({
          head: [100, 24], neck: [100, 38], hip: [100, 76],
          elbowF: [92, 28], handF: [98, 20], elbowB: [92, 28], handB: [98, 20],
        }), ms: 1500,
      },
      {
        pose: pose({
          head: [138, 64], neck: [127, 70], hip: [88, 78],
          kneeF: [94, 102], kneeB: [94, 102],
          elbowF: [124, 58], handF: [132, 62], elbowB: [124, 58], handB: [132, 62],
        }), ms: 1500,
      },
    ],
  },
  // ---------------- added: Strava-library exercises ----------------
  {
    id: 'incline-push-up', name: 'Incline push-up', category: 'strength',
    bodyAreas: ['chest', 'arms', 'core'],
    mode: 'reps', defaultValue: 12, defaultSets: 3, perSide: false,
    instructions: [
      'Place your hands on a stable bench, step or countertop, slightly wider than your shoulders.',
      'Walk your feet back until your body forms one straight line from head to heels.',
      'Lower your chest toward the edge, then press back up without letting your hips sag.',
    ],
    props: [{ x: 24, y: 100, w: 40, h: 26 }],
    animation: [
      { pose: pose(inclineUp), ms: 1000 },
      { pose: pose(inclineDown), ms: 1000 },
    ],
  },
  {
    id: 'pike-push-up', name: 'Pike push-up', category: 'strength',
    bodyAreas: ['shoulders', 'arms', 'core'],
    mode: 'reps', defaultValue: 8, defaultSets: 3, perSide: false,
    instructions: [
      'Start in a downward-dog position: hands on the floor, hips high, legs nearly straight.',
      'Bend your elbows and lower the top of your head toward the floor between your hands.',
      'Press back up to the start, keeping your hips high throughout.',
    ],
    animation: [
      { pose: pose(pikeUp), ms: 1100 },
      { pose: pose(pikeDown), ms: 1100 },
    ],
  },
  {
    id: 'bicycle-crunch', name: 'Bicycle crunch', category: 'strength',
    bodyAreas: ['core'],
    mode: 'reps', defaultValue: 20, defaultSets: 2, perSide: false,
    instructions: [
      'Lie on your back with your hands lightly behind your head and your shoulders lifted.',
      'Bring one knee in while you rotate your opposite elbow toward it, extending the other leg.',
      'Switch sides in a slow pedalling motion. One rep = one twist to either side.',
    ],
    animation: [
      { pose: pose(bicycleA), ms: 700 },
      { pose: pose(bicycleB), ms: 700 },
    ],
  },
  {
    id: 'flutter-kicks', name: 'Flutter kicks', category: 'strength',
    bodyAreas: ['core', 'hips'],
    mode: 'time', defaultValue: 30, defaultSets: 2, perSide: false,
    instructions: [
      'Lie on your back with your hands under your glutes and your legs straight, just off the floor.',
      'Press your lower back into the floor and kick your legs up and down in small, quick alternating beats.',
      'Keep your legs straight and your lower back from arching.',
    ],
    animation: [
      { pose: pose(flutterA), ms: 350 },
      { pose: pose(flutterB), ms: 350 },
    ],
  },
  {
    id: 'side-lunge', name: 'Side lunge', category: 'strength',
    bodyAreas: ['quads', 'glutes', 'hips'],
    mode: 'reps', defaultValue: 8, defaultSets: 2, perSide: true,
    instructions: [
      'Stand tall with your feet together and your hands in front of your chest.',
      'Take a big step out to the side and sit your hips back, bending that knee while the other leg stays straight.',
      'Push through the bent leg to return to standing. Keep both feet pointing forward.',
    ],
    animation: [
      { pose: pose({ ...armsForward }), ms: 1200 },
      { pose: pose(sideLungeDown), ms: 1200 },
    ],
  },
  {
    id: 'frog-pump', name: 'Frog pump', category: 'strength',
    bodyAreas: ['glutes', 'hips'],
    mode: 'reps', defaultValue: 15, defaultSets: 3, perSide: false,
    instructions: [
      'Lie on your back with the soles of your feet together and your knees dropped out to the sides.',
      'Bring your heels close to your glutes and press your hips up by squeezing your glutes.',
      'Pause at the top, then lower with control. Keep the soles of your feet pressed together.',
    ],
    animation: [
      { pose: pose(frogDown), ms: 1100 },
      { pose: pose({ ...frogDown, hip: [90, 94], neck: [44, 112], head: [30, 112], kneeF: [112, 96], kneeB: [114, 96] }), ms: 1100 },
    ],
  },
  {
    id: 'standing-hip-circles', name: 'Standing hip circles', category: 'mobility',
    bodyAreas: ['hips', 'glutes'],
    mode: 'reps', defaultValue: 8, defaultSets: 1, perSide: true,
    instructions: [
      'Stand on one leg with your hands on your hips or lightly on a wall for balance.',
      'Lift the other knee to hip height and draw big, slow circles with it.',
      'Keep your torso still and your standing leg stable. Do all circles one way, then the other.',
    ],
    animation: [
      { pose: pose({ ...handsOnHips, kneeF: [126, 78], ankleF: [114, 102], toeF: [122, 104] }), ms: 900 },
      { pose: pose({ ...handsOnHips, kneeF: [112, 88], ankleF: [102, 112], toeF: [110, 114] }), ms: 900 },
      { pose: pose({ ...handsOnHips, kneeF: [94, 82], ankleF: [78, 100], toeF: [70, 102] }), ms: 900 },
      { pose: pose({ ...handsOnHips, kneeF: [114, 74], ankleF: [112, 98], toeF: [120, 100] }), ms: 900 },
    ],
  },
  {
    id: 'pigeon-pose', name: 'Pigeon pose', category: 'stretch',
    bodyAreas: ['glutes', 'hips'],
    mode: 'time', defaultValue: 45, defaultSets: 1, perSide: true,
    instructions: [
      'From all fours, slide one knee forward behind your wrist and angle that shin across your body.',
      'Extend the other leg straight back with the top of the foot on the floor and square your hips.',
      'Stay upright, or fold forward over the front leg for a deeper stretch. Breathe slowly.',
    ],
    animation: [
      { pose: pose(pigeonUp), ms: 2000 },
      { pose: pose(pigeonFold), ms: 2000 },
    ],
  },
  {
    id: 'thread-the-needle', name: 'Thread the needle stretch', category: 'stretch',
    bodyAreas: ['upper back', 'shoulders'],
    mode: 'time', defaultValue: 30, defaultSets: 1, perSide: true,
    instructions: [
      'Start on all fours with your hands under your shoulders and your knees under your hips.',
      'Slide one arm along the floor under your chest, palm up, and let that shoulder and ear rest on the floor.',
      'Keep your hips over your knees and breathe into the upper back. Return and switch sides.',
    ],
    animation: [
      { pose: pose(quadruped), ms: 1800 },
      { pose: pose(threadDown), ms: 1800 },
    ],
  },
  {
    id: 'lying-hamstring-stretch', name: 'Lying hamstring stretch', category: 'stretch',
    bodyAreas: ['hamstrings', 'calves'],
    mode: 'time', defaultValue: 30, defaultSets: 1, perSide: true,
    instructions: [
      'Lie on your back and lift one leg, holding behind the thigh (or calf) with both hands.',
      'Gently straighten the raised leg until you feel a stretch in the back of the thigh.',
      'Keep your head and the other leg relaxed on the floor and your lower back flat.',
    ],
    animation: [
      { pose: pose(lyingHamLow), ms: 2000 },
      { pose: pose(lyingHamHigh), ms: 2000 },
    ],
  },
  // ---------------- added: mobility ----------------
  {
    id: 'deep-squat-hold', name: 'Deep squat hold', category: 'mobility',
    bodyAreas: ['hips', 'calves', 'glutes'],
    mode: 'time', defaultValue: 30, defaultSets: 2, perSide: false,
    instructions: [
      'Stand with feet slightly wider than your shoulders and toes turned out a little.',
      'Sink into a deep squat with your heels down and chest up, hands together in front of your chest.',
      'Use your elbows to gently press the knees out. Hold on to a doorframe if you need support.',
    ],
    animation: [
      { pose: pose({ ...handsOnHips, elbowF: [100, 58], handF: [108, 52], elbowB: [100, 58], handB: [108, 52] }), ms: 1500 },
      {
        pose: pose({
          head: [92, 56], neck: [88, 70], hip: [76, 106],
          kneeF: [112, 100], kneeB: [112, 100], ankleF: [96, 126], ankleB: [96, 126],
          toeF: [108, 126], toeB: [108, 126],
          elbowF: [100, 88], handF: [108, 78], elbowB: [100, 88], handB: [108, 78],
        }), ms: 1500,
      },
    ],
  },
  {
    id: 'supine-twist', name: 'Lying spinal twist', category: 'mobility',
    bodyAreas: ['hips', 'upper back'],
    mode: 'time', defaultValue: 30, defaultSets: 1, perSide: true,
    instructions: [
      'Lie on your back with arms out to the sides and knees bent.',
      'Let both knees fall slowly to one side while your shoulders stay on the floor.',
      'Breathe out and relax into the rotation, then come back to centre and switch sides.',
    ],
    animation: [
      { pose: pose(bridgeDown), ms: 1800 },
      {
        pose: pose({
          ...bridgeDown, kneeF: [110, 108], ankleF: [124, 120], toeF: [134, 124],
          kneeB: [112, 110], ankleB: [128, 122], toeB: [138, 125],
        }), ms: 1800,
      },
    ],
  },
  // ---------------- added: stretches ----------------
  {
    id: 'seated-forward-fold', name: 'Seated forward fold', category: 'stretch',
    bodyAreas: ['hamstrings', 'calves'],
    mode: 'time', defaultValue: 30, defaultSets: 1, perSide: false,
    instructions: [
      'Sit with both legs straight in front of you and your toes pointing up.',
      'Hinge from the hips and reach toward your feet with a long spine.',
      'Stop where you feel a stretch behind the thighs. Do not force it or round hard through the back.',
    ],
    animation: [
      {
        pose: pose({
          ...seated, head: [80, 66], neck: [80, 80],
          kneeB: [105, 122], ankleB: [130, 122], toeB: [133, 110],
          elbowF: [98, 98], handF: [112, 118], elbowB: [98, 98], handB: [112, 118],
        }), ms: 1800,
      },
      {
        pose: pose({
          ...seated, head: [124, 90], neck: [110, 94],
          kneeB: [105, 122], ankleB: [130, 122], toeB: [133, 110],
          elbowF: [118, 108], handF: [132, 118], elbowB: [118, 108], handB: [132, 118],
        }), ms: 2200,
      },
    ],
  },
  {
    id: 'cross-body-shoulder-stretch', name: 'Cross-body shoulder stretch', category: 'stretch',
    bodyAreas: ['shoulders', 'upper back'],
    mode: 'time', defaultValue: 30, defaultSets: 1, perSide: true,
    instructions: [
      'Stand tall and bring one arm straight across your chest at shoulder height.',
      'Use the other hand to hold it just above the elbow and draw it gently closer.',
      'Keep the shoulder down and relaxed. You should feel it in the back of the shoulder.',
    ],
    animation: [
      { pose: pose({ elbowF: [100, 58], handF: [100, 76], elbowB: [100, 58], handB: [100, 76] }), ms: 1500 },
      {
        pose: pose({
          elbowF: [112, 42], handF: [92, 40], elbowB: [104, 50], handB: [114, 42],
        }), ms: 1500,
      },
    ],
  },
  {
    id: 'triceps-stretch', name: 'Overhead tricep stretch', category: 'stretch',
    bodyAreas: ['arms', 'shoulders'],
    mode: 'time', defaultValue: 30, defaultSets: 1, perSide: true,
    instructions: [
      'Stand tall and raise one arm, bending the elbow so your hand drops behind your head.',
      'With the other hand, gently press the raised elbow back and down.',
      'Keep your ribs down and avoid arching your back.',
    ],
    animation: [
      { pose: pose({ elbowF: [100, 58], handF: [100, 76], elbowB: [100, 58], handB: [100, 76] }), ms: 1500 },
      {
        pose: pose({
          elbowF: [102, 10], handF: [90, 28], elbowB: [112, 22], handB: [104, 10],
        }), ms: 1500,
      },
    ],
  },
  {
    id: 'doorway-chest-stretch', name: 'Wall chest stretch', category: 'stretch',
    bodyAreas: ['chest', 'shoulders'],
    mode: 'time', defaultValue: 30, defaultSets: 1, perSide: true,
    instructions: [
      'Stand beside a doorframe or wall with your forearm against it, elbow bent at about 90 degrees.',
      'Take a small step forward and gently turn your body away until you feel the front of the shoulder and chest open.',
      'Keep your shoulder down and your neck relaxed. Great for desk or bike posture.',
    ],
    props: [{ x: 134, y: 10, w: 6, h: 116 }],
    animation: [
      {
        pose: pose({
          head: [100, 24], neck: [100, 38], hip: [100, 76],
          elbowF: [118, 40], handF: [132, 24], elbowB: [100, 58], handB: [100, 76],
        }), ms: 1800,
      },
      {
        pose: pose({
          head: [108, 24], neck: [108, 38], hip: [102, 76],
          kneeF: [102, 101], kneeB: [102, 101],
          elbowF: [120, 40], handF: [132, 24], elbowB: [100, 58], handB: [100, 76],
        }), ms: 1800,
      },
    ],
  },
]

/** The library with the coaching content merged in. */
export const EXERCISES: Exercise[] = BASE.map((e) => ({ ...e, ...COACHING[e.id], ...(GEAR_OPTIONS[e.id] ? { gearOptions: GEAR_OPTIONS[e.id] } : {}) }))

export const EXERCISE_MAP = new Map(EXERCISES.map((e) => [e.id, e]))

/** True when the user has everything the exercise needs (bodyweight exercises always pass). */
export const canDo = (e: Exercise, have: readonly Equipment[]) => (e.equipment ?? []).every((x) => have.includes(x))

/** The exercise as done with `gear` (adds the gear to its drawing and equipment). Unsupported or missing gear returns it unchanged. */
export function withGear(e: Exercise, gear?: Equipment): Exercise {
  // Only real equipment kinds: a corrupt value like "toString" would otherwise hit an Object.prototype member.
  const drawn = gear && EQUIPMENT.includes(gear) ? e.gearOptions?.[gear] : undefined
  if (!gear || !drawn) return e
  return { ...e, gearUsed: gear, gear: [...(e.gear ?? []), ...drawn], equipment: [...new Set([...(e.equipment ?? []), gear])] }
}
