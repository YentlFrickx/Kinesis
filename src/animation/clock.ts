// One shared animation clock for all figures on screen (~30fps).
// The rAF loop runs only while at least one figure is subscribed.
const FRAME_MS = 33
const subs = new Set<() => void>()
let raf = 0
let last = 0
let now = 0

function loop(t: number) {
  raf = 0 // this frame has fired; a (re)subscribe during the callbacks below may schedule the next one
  if (t - last >= FRAME_MS) {
    last = t
    now = t
    subs.forEach((f) => f())
  }
  // A subscriber may have left during the callbacks above; never keep a loop running for nobody.
  if (subs.size > 0 && !raf) raf = requestAnimationFrame(loop)
}

export function subscribeClock(cb: () => void): () => void {
  subs.add(cb)
  // Exactly one loop at a time: `raf` is 0 only when no frame is scheduled.
  if (!raf) raf = requestAnimationFrame(loop)
  return () => {
    subs.delete(cb)
    if (subs.size === 0 && raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }
}

export const clockNow = () => now
