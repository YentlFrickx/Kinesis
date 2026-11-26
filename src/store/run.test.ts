import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '../data/types'
import { installStorage } from './testStorage'

afterEach(() => vi.unstubAllGlobals())
const load = async (initial?: Record<string, string>) => {
  installStorage(initial)
  return import('./run')
}

const session: Session = {
  id: 's1', name: 'S', defaultSetRestSec: 30, defaultTransitionSec: 10,
  items: [{ id: 'a', exerciseId: 'plank', value: 30, sets: 2 }],
}
const NOW = 1_000_000_000_000
const base = (sig: string) => ({ sessionId: 's1', signature: sig, index: 3, remainingMs: 12000, activeMs: 5000, savedAt: NOW - 1000 })

describe('run store', () => {
  it('saves, reloads and clears', async () => {
    const r = await load()
    const run = base(r.sessionSignature(session))
    r.saveRun(run)
    expect(r.getSavedRun()).toEqual(run)
    const again = await import('./run')
    expect(again.getSavedRun()).toEqual(run)
    again.clearRun()
    expect((await import('./run')).getSavedRun()).toBeUndefined()
  })

  it('ignores junk and other versions', async () => {
    expect((await load({ 'rw.run.v1': 'junk' })).getSavedRun()).toBeUndefined()
    expect((await load({ 'rw.run.v1': JSON.stringify({ version: 2, run: {} }) })).getSavedRun()).toBeUndefined()
  })

  it('validates a fresh run', async () => {
    const r = await load()
    const run = base(r.sessionSignature(session))
    expect(r.validateRun(run, session, 10, NOW)).toEqual(run)
    expect(r.validateRun({ ...run, remainingMs: null }, session, 10, NOW)).toBeTruthy()
  })

  it('rejects missing, edited or mismatched sessions', async () => {
    const r = await load()
    const run = base(r.sessionSignature(session))
    expect(r.validateRun(run, undefined, 10, NOW)).toBeUndefined()
    expect(r.validateRun(run, { ...session, id: 'other' }, 10, NOW)).toBeUndefined()
    expect(r.validateRun(run, { ...session, items: [{ ...session.items[0], sets: 3 }] }, 10, NOW)).toBeUndefined()
    expect(r.validateRun(run, { ...session, defaultSetRestSec: 45 }, 10, NOW)).toBeUndefined()
    expect(r.validateRun(run, { ...session, name: 'Renamed' }, 10, NOW)).toEqual(run)
  })

  it('rejects stale, out-of-range and malformed runs', async () => {
    const r = await load()
    const run = base(r.sessionSignature(session))
    expect(r.validateRun({ ...run, savedAt: NOW - r.MAX_AGE_MS - 1 }, session, 10, NOW)).toBeUndefined()
    expect(r.validateRun({ ...run, savedAt: NOW + 3_600_000 }, session, 10, NOW)).toBeUndefined()
    expect(r.validateRun({ ...run, index: 10 }, session, 10, NOW)).toBeUndefined()
    expect(r.validateRun({ ...run, index: -1 }, session, 10, NOW)).toBeUndefined()
    expect(r.validateRun({ ...run, remainingMs: -5 }, session, 10, NOW)).toBeUndefined()
    expect(r.validateRun({ ...run, activeMs: NaN }, session, 10, NOW)).toBeUndefined()
    expect(r.validateRun(null, session, 10, NOW)).toBeUndefined()
    expect(r.validateRun(run, session, 0, NOW)).toBeUndefined()
  })
})
