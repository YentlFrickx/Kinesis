import { afterEach, describe, expect, it, vi } from 'vitest'
import { installStorage } from './testStorage'

afterEach(() => vi.unstubAllGlobals())

describe('milestones store', () => {
  it('unlocks once and never relocks after history is cleared', async () => {
    const data = installStorage()
    const h = await import('./history')
    const m = await import('./milestones')
    expect(m.syncMilestones()).toEqual([])
    h.recordCompletion('s', 'a', 60)
    const fresh = m.syncMilestones()
    expect(fresh.length).toBeGreaterThan(0)
    expect(m.syncMilestones()).toEqual([])
    const stored = JSON.parse(data.get('rw.milestones.v1')!)
    expect(Object.keys(stored).sort()).toEqual([...fresh].sort())
    h.clearHistory()
    expect(m.syncMilestones()).toEqual([])
    expect(JSON.parse(data.get('rw.milestones.v1')!)).toEqual(stored)
  })

  it('tolerates corrupt storage', async () => {
    installStorage({ 'rw.milestones.v1': '[1]' })
    const m = await import('./milestones')
    expect(m.syncMilestones()).toEqual([])
  })
})
