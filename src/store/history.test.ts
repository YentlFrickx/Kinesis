import { afterEach, describe, expect, it, vi } from 'vitest'
import { installStorage } from './testStorage'

afterEach(() => vi.unstubAllGlobals())
const load = async (initial?: Record<string, string>) => {
  const data = installStorage(initial)
  return { data, h: await import('./history') }
}

describe('history store', () => {
  it('records newest first and persists', async () => {
    const { data, h } = await load()
    h.recordCompletion('s1', 'One', 61.6, { strength: 2 })
    const e = h.recordCompletion('s2', 'Two', -5)
    expect(e.durationSec).toBe(0)
    expect(h.getHistory().map((x) => x.sessionName)).toEqual(['Two', 'One'])
    expect(h.getHistory()[1]).toMatchObject({ durationSec: 62, categories: { strength: 2 } })
    expect(h.getHistory()[0]).not.toHaveProperty('categories')
    expect(JSON.parse(data.get('rw.history.v1')!).entries).toHaveLength(2)
    expect((await load(Object.fromEntries(data))).h.getHistory()).toHaveLength(2)
  })

  it('caps at 500 entries, dropping the oldest', async () => {
    const { h } = await load()
    for (let i = 0; i < 505; i++) h.recordCompletion('s', `n${i}`, 1)
    expect(h.getHistory()).toHaveLength(500)
    expect(h.getHistory()[0].sessionName).toBe('n504')
    expect(h.getHistory().at(-1)!.sessionName).toBe('n5')
  })

  it('deletes one entry and clears all', async () => {
    const { h } = await load()
    const a = h.recordCompletion('s', 'a', 1)
    h.recordCompletion('s', 'b', 1)
    h.deleteEntry(a.id)
    expect(h.getHistory().map((x) => x.sessionName)).toEqual(['b'])
    h.clearHistory()
    expect(h.getHistory()).toEqual([])
  })

  it('ignores corrupt storage', async () => {
    expect((await load({ 'rw.history.v1': 'zzz' })).h.getHistory()).toEqual([])
  })
})
