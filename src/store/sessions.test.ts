import { afterEach, describe, expect, it, vi } from 'vitest'
import { STARTERS } from '../data/templates'
import { installStorage } from './testStorage'

afterEach(() => vi.unstubAllGlobals())
const load = async (initial?: Record<string, string>) => {
  const data = installStorage(initial)
  return { data, s: await import('./sessions') }
}
const ids = (s: { id: string }[]) => s.map((x) => x.id)

describe('sessions store', () => {
  it('seeds starters once on first launch', async () => {
    const { data, s } = await load()
    expect(JSON.parse(data.get('rw.sessions.v1')!).sessions).toHaveLength(STARTERS.length)
    expect(data.get('rw.seeded.v1')).toBe('1')
    expect(s.missingStarters()).toEqual([])
  })

  it('does not reseed after a starter was deleted, but can restore it', async () => {
    const { data, s } = await load()
    s.deleteSession(STARTERS[0].id)
    expect(s.missingStarters().map((x) => x.id)).toEqual([STARTERS[0].id])
    const again = await load(Object.fromEntries(data))
    expect(again.s.getSession(STARTERS[0].id)).toBeUndefined()
    expect(again.s.restoreStarters()).toBe(1)
    expect(again.s.restoreStarters()).toBe(0)
    expect(again.s.getSession(STARTERS[0].id)).toBeDefined()
  })

  it('creates, updates, duplicates and deletes', async () => {
    const { s } = await load({ 'rw.seeded.v1': '1' })
    const a = s.createSession('A')
    expect(s.getSession(a.id)).toMatchObject({ name: 'A', items: [] })
    s.updateSession(a.id, (x) => ({ ...x, items: [{ exerciseId: 'push-up', value: 5, sets: 2 }] }))
    const copy = s.duplicateSession(a.id)!
    expect(copy.name).toBe('A (copy)')
    expect(copy.id).not.toBe(a.id)
    s.updateSession(copy.id, (x) => ({ ...x, items: [] }))
    expect(s.getSession(a.id)!.items).toHaveLength(1) // copy does not share items
    s.deleteSession(a.id)
    expect(s.getSession(a.id)).toBeUndefined()
    expect(s.duplicateSession('missing')).toBeUndefined()
  })

  it('round-trips export/import with new ids', async () => {
    const { s } = await load({ 'rw.seeded.v1': '1' })
    const a = s.createSession('Mine')
    s.updateSession(a.id, (x) => ({ ...x, items: [{ exerciseId: 'push-up', value: 5, sets: 2 }] }))
    expect(s.importJson(s.exportJson())).toBe(1)
    const all = s.exportJson()
    expect(new Set(ids(JSON.parse(all).sessions)).size).toBe(2)
  })

  it('keeps, trims and clamps item notes on import', async () => {
    const { s } = await load({ 'rw.seeded.v1': '1' })
    s.importJson(JSON.stringify({ sessions: [{ name: 'x', items: [
      { exerciseId: 'push-up', value: 5, sets: 1, note: '  use the 8 kg dumbbell  ' },
      { exerciseId: 'push-up', value: 5, sets: 1, note: 'n'.repeat(500) },
      { exerciseId: 'push-up', value: 5, sets: 1, note: 42 },
      { exerciseId: 'push-up', value: 5, sets: 1, note: '   ' },
    ] }] }))
    const items = JSON.parse(s.exportJson()).sessions[0].items
    expect(items[0].note).toBe('use the 8 kg dumbbell')
    expect(items[1].note).toHaveLength(200)
    expect('note' in items[2]).toBe(false)
    expect('note' in items[3]).toBe(false)
  })

  it('validates and clamps imports', async () => {
    const { s } = await load({ 'rw.seeded.v1': '1' })
    expect(() => s.importJson('nope')).toThrow()
    expect(() => s.importJson('{"sessions":1}')).toThrow('Not a workout export file')
    const n = s.importJson(JSON.stringify({ sessions: [
      null, { name: 5, items: [] }, { name: 'x', items: 'no' },
      {
        name: 'n'.repeat(200), defaultSetRestSec: 9999, defaultTransitionSec: 'x',
        items: [
          { exerciseId: 'push-up', value: 99999, sets: 0, restAfterSec: -4 },
          { exerciseId: 'does-not-exist', value: 5, sets: 1 },
          { exerciseId: 'forearm-plank', value: 'x', sets: 50 },
        ],
      },
    ] }))
    expect(n).toBe(1)
    const imported = JSON.parse(s.exportJson()).sessions[0]
    expect(imported.name).toHaveLength(80)
    expect(imported.defaultSetRestSec).toBe(600)
    expect(imported.defaultTransitionSec).toBe(10)
    expect(imported.items).toEqual([
      { exerciseId: 'push-up', value: 3600, sets: 1, restAfterSec: 0 },
      { exerciseId: 'forearm-plank', value: 30, sets: 20 },
    ])
  })

  it('survives corrupt or wrong-version storage', async () => {
    const { s } = await load({ 'rw.sessions.v1': '{bad', 'rw.seeded.v1': '1' })
    expect(s.exportJson()).toContain('"sessions": []')
    const v = await load({ 'rw.sessions.v1': JSON.stringify({ version: 99, sessions: [{}] }), 'rw.seeded.v1': '1' })
    expect(JSON.parse(v.s.exportJson()).sessions).toEqual([])
  })
})
