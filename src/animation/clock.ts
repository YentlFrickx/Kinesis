// One shared animation clock for all figures on screen (~30fps).
// The rAF loop runs only while at least one figure is subscribed.
const FRAME_MS = 33
const subs = new Set<() => void>()
let raf = 0
let last = 0
let now = 0

function loop(t: number) {
  if (t - last >= FRAME_MS) {
    last = t
    now = t
    subs.forEach((f) => f())
  }
  // A subscriber may have left during the callbacks above; never keep a loop running for nobody.
  raf = subs.size > 0 ? requestAnimationFrame(loop) : 0
}

export function subscribeClock(cb: () => void): () => void {
  subs.add(cb)
  if (subs.size === 1) raf = requestAnimationFrame(loop)
  return () => {
    subs.delete(cb)
    if (subs.size === 0) cancelAnimationFrame(raf)
  }
}

export const clockNow = () => now
