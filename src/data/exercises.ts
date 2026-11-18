import { pose, type Pose } from '../animation/skeleton'
import type { Exercise } from './types'

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
const plankBase: P = {
  head: [38, 96], neck: [50, 98], hip: [98, 109],
  kneeF: [124, 115], ankleF: [150, 122], toeF: [155, 125],
  kneeB: [124, 115], ankleB: [150, 122], toeB: [155, 125],
  elbowF: [50, 124], handF: [68, 124], elbowB: [50, 124], handB: [68, 124],
}
const sidePlankUp: P = {
  head: [32, 94], neck: [44, 98], hip: [92, 104],
  kneeF: [114, 114], ankleF: [136, 123], toeF: [142, 125],
  kneeB: [114, 113], ankleB: [136, 122], toeB: [142, 124],
  elbowF: [44, 124], handF: [62, 124], elbowB: [46, 84], handB: [46, 64],
}
const swingSupport: P = {
  kneeB: [100, 101], ankleB: [100, 126], toeB: [110, 126],
  elbowF: [114, 56], handF: [128, 54], elbowB: [86, 56], handB: [72, 54],
}
const calfRaiseArms: P = { ...handsOnHips }

export const EXERCISES: Exercise[] = [
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
    id: 'bodyweight-squat', name: 'Bodyweight squat', category: 'strength',
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
    id: 'forearm-plank', name: 'Forearm plank', category: 'strength',
    bodyAreas: ['core'],
    mode: 'time', defaultValue: 30, defaultSets: 2, perSide: false,
    instructions: [
      'Rest on your forearms, elbows under shoulders, body in one straight line.',
      'Brace your abs and squeeze your glutes. Do not let the hips sag or pike.',
      'Breathe steadily and hold.',
    ],
    animation: [
      { pose: pose(plankBase), ms: 1500 },
      { pose: pose({ ...plankBase, hip: [98, 106], kneeF: [124, 113], kneeB: [124, 113], head: [38, 94], neck: [50, 96] }), ms: 1500 },
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
      {
        pose: pose({
          ...sideLying, kneeB: [120, 118], ankleB: [145, 118], toeB: [151, 121],
          kneeF: [120, 116], ankleF: [145, 116], toeF: [151, 119],
        }), ms: 1200,
      },
      {
        pose: pose({
          ...sideLying, kneeB: [120, 118], ankleB: [145, 118], toeB: [151, 121],
          kneeF: [116, 100], ankleF: [136, 84], toeF: [143, 82],
        }), ms: 1200,
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
]

export const EXERCISE_MAP = new Map(EXERCISES.map((e) => [e.id, e]))
