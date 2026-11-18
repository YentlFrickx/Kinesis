import { useEffect, useRef, useState } from 'react'
import { BONES, VIEWBOX, poseAt, type Keyframe, type Pose } from './skeleton'

interface Props {
  frames: readonly Keyframe[]
  playing?: boolean
  label: string
}

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function Figure({ frames, playing = true, label }: Props) {
  const [pose, setPose] = useState<Pose>(frames[0].pose)
  const start = useRef(performance.now())

  useEffect(() => {
    if (!playing || reduceMotion()) {
      setPose(frames[0].pose)
      return
    }
    let raf = 0
    const tick = (now: number) => {
      setPose(poseAt(frames, now - start.current))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [frames, playing])

  const { width, height, floorY } = VIEWBOX
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="figure">
      <line x1="10" x2={width - 10} y1={floorY + 3} y2={floorY + 3} className="floor" />
      {BONES.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={pose[a][0]} y1={pose[a][1]} x2={pose[b][0]} y2={pose[b][1]}
          className={a.endsWith('B') || b.endsWith('B') ? 'bone far' : 'bone'}
        />
      ))}
      <circle cx={pose.head[0]} cy={pose.head[1]} r="9" className="head" />
    </svg>
  )
}
