export const JOINTS = [
  'head', 'neck', 'hip',
  'kneeF', 'ankleF', 'toeF',
  'kneeB', 'ankleB', 'toeB',
  'elbowF', 'handF', 'elbowB', 'handB',
] as const

export type Joint = (typeof JOINTS)[number]
export type Point = readonly [number, number]
export type Pose = Record<Joint, Point>

/** [from, to] pairs drawn as limbs. The head is drawn as a circle. */
export const BONES: ReadonlyArray<readonly [Joint, Joint]> = [
  ['neck', 'hip'],
  ['hip', 'kneeB'], ['kneeB', 'ankleB'], ['ankleB', 'toeB'],
  ['neck', 'elbowB'], ['elbowB', 'handB'],
  ['hip', 'kneeF'], ['kneeF', 'ankleF'], ['ankleF', 'toeF'],
  ['neck', 'elbowF'], ['elbowF', 'handF'],
]

/** Simple rectangle drawn behind the figure (box, wall...). */
export interface Prop { x: number; y: number; w: number; h: number }

export const VIEWBOX = { width: 200, height: 140, floorY: 126 }

/** Neutral standing pose, facing right, used as a base for building poses. */
export const STANDING: Pose = {
  head: [100, 24], neck: [100, 38], hip: [100, 76],
  kneeF: [100, 101], ankleF: [100, 126], toeF: [110, 126],
  kneeB: [100, 101], ankleB: [100, 126], toeB: [110, 126],
  elbowF: [100, 58], handF: [100, 76], elbowB: [100, 58], handB: [100, 76],
}

export const pose = (overrides: Partial<Pose>): Pose => ({ ...STANDING, ...overrides })

export interface Keyframe {
  pose: Pose
  /** Milliseconds to transition from the previous keyframe to this one. */
  ms: number
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

export function mixPose(a: Pose, b: Pose, t: number): Pose {
  const e = ease(t)
  const out = {} as Record<Joint, Point>
  for (const j of JOINTS) out[j] = [lerp(a[j][0], b[j][0], e), lerp(a[j][1], b[j][1], e)]
  return out
}

/**
 * Pose at time `elapsed` for a looping animation. Keyframe 0 is the start;
 * every later keyframe is reached after its `ms`, and the loop returns to
 * keyframe 0 using the first keyframe's `ms` as the return duration.
 */
export function poseAt(frames: readonly Keyframe[], elapsed: number): Pose {
  const total = frames.reduce((s, f) => s + f.ms, 0)
  let t = ((elapsed % total) + total) % total
  for (let i = 0; i < frames.length; i++) {
    const next = frames[(i + 1) % frames.length]
    if (t < next.ms) return mixPose(frames[i].pose, next.pose, t / next.ms)
    t -= next.ms
  }
  return frames[0].pose
}
