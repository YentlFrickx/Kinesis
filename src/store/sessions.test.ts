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
          { exerciseId: 'forearm-plank', value: 'x', sets: 50, restAfterSec: null },
          { exerciseId: 'forearm-plank', value: 9999, sets: 2 },
        ],
      },
    ] }))
    expect(n).toBe(1)
    const imported = JSON.parse(s.exportJson()).sessions[0]
    expect(imported.name).toHaveLength(80)
    expect(imported.defaultSetRestSec).toBe(300)
    expect(imported.defaultTransitionSec).toBe(10)
    expect(imported.items.every((i: { id?: string }) => typeof i.id === 'string' && i.id)).toBe(true)
    expect(imported.items.map(({ id: _id, ...rest }: { id?: string }) => rest)).toEqual([
      // Clamped to the editor's ranges (reps max 100, time max 600, sets max 10); a missing value uses the exercise default.
      { exerciseId: 'push-up', value: 100, sets: 1, restAfterSec: 0 },
      { exerciseId: 'forearm-plank', value: 30, sets: 10 },
      { exerciseId: 'forearm-plank', value: 600, sets: 2 },
    ])
  })

  it('survives corrupt or wrong-version storage', async () => {
    const { s } = await load({ 'rw.sessions.v1': '{bad', 'rw.seeded.v1': '1' })
    expect(s.exportJson()).toContain('"sessions": []')
    const v = await load({ 'rw.sessions.v1': JSON.stringify({ version: 99, sessions: [{}] }), 'rw.seeded.v1': '1' })
    expect(JSON.parse(v.s.exportJson()).sessions).toEqual([])
  })
})

describe('item ids', () => {
  it('migrates stored sessions without ids, keeping data and existing ids', async () => {
    const stored = { version: 1, sessions: [{ id: 'x', name: 'X', defaultSetRestSec: 30, defaultTransitionSec: 10,
      items: [{ exerciseId: 'push-up', value: 5, sets: 2, note: 'hi' }, { id: 'keep', exerciseId: 'push-up', value: 6, sets: 1 }] }] }
    const { s } = await load({ 'rw.seeded.v1': '1', 'rw.sessions.v1': JSON.stringify(stored) })
    const items = s.getSession('x')!.items
    expect(items[0]).toMatchObject({ exerciseId: 'push-up', value: 5, sets: 2, note: 'hi' })
    expect(items[0].id).toBeTruthy()
    expect(items[1].id).toBe('keep')
  })

  it('restores a deleted session at its index', async () => {
    const { s } = await load({ 'rw.seeded.v1': '1' })
    const a = s.createSession('A'); s.createSession('B')
    const at = s.sessionIndex(a.id)
    s.deleteSession(a.id)
    s.restoreSession(a, at)
    expect(s.sessionIndex(a.id)).toBe(at)
  })

  it('drops gear that is not real equipment on import', async () => {
    const { s } = await load({ 'rw.seeded.v1': '1' })
    s.importJson(JSON.stringify({ sessions: [{ name: 'x', items: [
      { exerciseId: 'glute-bridge', value: 5, sets: 1, gear: 'toString' },
      { exerciseId: 'glute-bridge', value: 5, sets: 1, gear: 'band' },
    ] }] }))
    const items = JSON.parse(s.exportJson()).sessions[0].items
    expect('gear' in items[0]).toBe(false)
    expect(items[1].gear).toBe('band')
  })

  it('keeps valid stored sessions when one is malformed', async () => {
    const good = { id: 'g', name: 'G', defaultSetRestSec: 30, defaultTransitionSec: 10, items: [{ id: 'i', exerciseId: 'push-up', value: 5, sets: 1 }] }
    const stored = { version: 1, sessions: [good, null, { id: 'b', name: 'B' }, { id: 'c', name: 'C', items: [null] }] }
    const { s } = await load({ 'rw.seeded.v1': '1', 'rw.sessions.v1': JSON.stringify(stored) })
    expect(JSON.parse(s.exportJson()).sessions).toEqual([good])
  })

  it('drops stored items whose exercise is gone and clamps corrupt values', async () => {
    const stored = { version: 1, sessions: [{ id: 's', name: 'S', defaultSetRestSec: 'x', defaultTransitionSec: 9999, items: [
      { id: 'a', exerciseId: 'removed-exercise', value: 5, sets: 1 },
      { id: 'b', exerciseId: 'push-up', value: 5, sets: 'x', gear: 'toString' },
      { exerciseId: 'push-up', value: -3, sets: 2, restAfterSec: 15, note: 'keep me' },
    ] }] }
    const { s } = await load({ 'rw.seeded.v1': '1', 'rw.sessions.v1': JSON.stringify(stored) })
    const session = s.getSession('s')!
    expect(session.defaultSetRestSec).toBe(30)
    expect(session.defaultTransitionSec).toBe(300)
    expect(session.items[0]).toEqual({ id: 'b', exerciseId: 'push-up', value: 5, sets: 1 })
    expect(session.items[1]).toMatchObject({ exerciseId: 'push-up', value: 1, sets: 2, restAfterSec: 15, note: 'keep me' })
    expect(session.items[1].id).toBeTruthy()
    expect(session.items).toHaveLength(2)
  })

  it('names an imported session with a blank name', async () => {
    const { s } = await load({ 'rw.seeded.v1': '1' })
    s.importJson(JSON.stringify({ sessions: [{ name: '   ', items: [] }] }))
    expect(JSON.parse(s.exportJson()).sessions[0].name).toBe('New session')
  })
})
