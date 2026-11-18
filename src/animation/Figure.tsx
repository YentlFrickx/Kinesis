import { useEffect, useRef, useState } from 'react'
import { BONES, VIEWBOX, poseAt, type Keyframe, type Pose, type Prop } from './skeleton'

interface Props {
  frames: readonly Keyframe[]
  props?: readonly Prop[]
  /** Animate the figure. When false, shows the first keyframe. */
  playing?: boolean
  /** Render this exact pose instead of animating (used by the contact sheet). */
  staticPose?: Pose
  label: string
  className?: string
}

const FRAME_MS = 33 // cap at ~30fps to save battery
const reduceMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function Figure({ frames, props = [], playing = true, staticPose, label, className }: Props) {
  const [animPose, setPose] = useState<Pose>(frames[0].pose)
  const [visible, setVisible] = useState(true)
  const svgRef = useRef<SVGSVGElement>(null)
  const start = useRef(0)

  const animating = playing && visible && !reduceMotion()
  const pose = staticPose ?? (animating ? animPose : frames[0].pose)

  // Only animate while on screen.
  useEffect(() => {
    const el = svgRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (staticPose || !animating) return
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      if (!start.current) start.current = now
      if (now - last >= FRAME_MS) {
        last = now
        setPose(poseAt(frames, now - start.current))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames, animating, staticPose])

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
