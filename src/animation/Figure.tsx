import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { clockNow, subscribeClock } from './clock'
import { usePrefersReducedMotion } from '../lib/reducedMotion'
import { BONES, VIEWBOX, poseAt, type Anchor, type Gear, type Keyframe, type Pose, type Prop } from './skeleton'

interface Props {
  frames: readonly Keyframe[]
  props?: readonly Prop[]
  gear?: readonly Gear[]
  /** Animate the figure (default). When false, shows the first keyframe. */
  playing?: boolean
  /** Animate even when the user prefers reduced motion. */
  forceMotion?: boolean
  /** Render this exact pose instead of animating (used by the contact sheet). */
  staticPose?: Pose
  label: string
  className?: string
}

const point = (pose: Pose, a: Anchor): readonly [number, number] => (typeof a === 'string' ? pose[a] : a)

const noopSubscribe = () => () => {}

/**
 * Exercise figure. With prefers-reduced-motion it shows a static pose unless the
 * caller opts in via `forceMotion` (driven by a manual play toggle).
 */
export function Figure({ frames, props = [], gear = [], playing = true, forceMotion = false, staticPose, label, className }: Props) {
  const [visible, setVisible] = useState(true)
  const svgRef = useRef<SVGSVGElement>(null)

  // Only animate while on screen.
  useEffect(() => {
    const el = svgRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const reduced = usePrefersReducedMotion()
  const animating = playing && visible && !staticPose && (!reduced || forceMotion)
  const t = useSyncExternalStore(animating ? subscribeClock : noopSubscribe, () => (animating ? clockNow() : 0))
  const pose: Pose = staticPose ?? (animating ? poseAt(frames, t) : frames[0].pose)

  const { width, height, floorY } = VIEWBOX
  return (
    <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}
      className={`figure ${className ?? ''}`}>
      <line x1="10" x2={width - 10} y1={floorY + 3} y2={floorY + 3} className="floor" />
      {props.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx="2" className="prop" />
      ))}
      {BONES.map(([a, b]) => (
        <line key={`${a}-${b}`}
          x1={pose[a][0]} y1={pose[a][1]} x2={pose[b][0]} y2={pose[b][1]}
          className={a.endsWith('B') || b.endsWith('B') ? 'bone far' : 'bone'} />
      ))}
      {gear.map((g, i) => {
        if (g.kind === 'band') {
          const [x1, y1] = point(pose, g.from)
          const [x2, y2] = point(pose, g.to)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="gear-band" />
        }
        const [x, y] = pose[g.at]
        return (
          <g key={i} className="gear-db">
            <line x1={x - 8} x2={x + 8} y1={y} y2={y} className="gear-bar" />
            <rect x={x - 11} y={y - 6} width="5" height="12" rx="1.5" />
            <rect x={x + 6} y={y - 6} width="5" height="12" rx="1.5" />
          </g>
        )
      })}
      <circle cx={pose.head[0]} cy={pose.head[1]} r="9" className="head" />
    </svg>
  )
}
