import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { clockNow, subscribeClock } from './clock'
import { BONES, VIEWBOX, poseAt, type Keyframe, type Pose, type Prop } from './skeleton'

interface Props {
  frames: readonly Keyframe[]
  props?: readonly Prop[]
  /** Animate the figure (default). When false, shows the first keyframe. */
  playing?: boolean
  /** Render this exact pose instead of animating (used by the contact sheet). */
  staticPose?: Pose
  label: string
  className?: string
}

const noopSubscribe = () => () => {}

/**
 * Exercise figure. Animation is the content here (it shows how to do the
 * exercise), so it is NOT disabled by prefers-reduced-motion.
 */
export function Figure({ frames, props = [], playing = true, staticPose, label, className }: Props) {
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

  const animating = playing && visible && !staticPose
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
      <circle cx={pose.head[0]} cy={pose.head[1]} r="9" className="head" />
    </svg>
  )
}
