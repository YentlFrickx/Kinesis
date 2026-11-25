import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => vi.unstubAllGlobals())

/** Fake rAF: frames run only when `flush` is called, so the number of scheduled loops is observable. */
async function setup() {
  const pending = new Map<number, (t: number) => void>()
  let id = 0
  vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => { pending.set(++id, cb); return id })
  vi.stubGlobal('cancelAnimationFrame', (h: number) => { pending.delete(h) })
  vi.resetModules()
  const clock = await import('./clock')
  const flush = (t: number) => { const cbs = [...pending.values()]; pending.clear(); cbs.forEach((cb) => cb(t)) }
  return { clock, pending, flush }
}

describe('animation clock', () => {
  it('runs one loop while subscribed and stops when everyone leaves', async () => {
    const { clock, pending, flush } = await setup()
    const a = vi.fn()
    const offA = clock.subscribeClock(a)
    clock.subscribeClock(vi.fn())()
    expect(pending.size).toBe(1)
    flush(100)
    expect(a).toHaveBeenCalledTimes(1)
    expect(clock.clockNow()).toBe(100)
    expect(pending.size).toBe(1)
    offA()
    expect(pending.size).toBe(0)
  })

  it('does not start a second loop when a figure resubscribes during a tick', async () => {
    const { clock, pending, flush } = await setup()
    let offB: (() => void) | undefined
    const offA = clock.subscribeClock(() => {
      offA()
      offB ??= clock.subscribeClock(() => {})
    })
    flush(100)
    expect(pending.size).toBe(1)
    offB!()
    expect(pending.size).toBe(0)
  })
})
