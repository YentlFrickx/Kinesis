import { beforeEach, describe, expect, it } from 'vitest'
import { EXERCISES } from '../data/exercises'
import { installStorage } from './testStorage'

const [a, b] = EXERCISES.map((e) => e.id)
beforeEach(() => void installStorage())

describe('favorites', () => {
  it('toggles and persists across reload', async () => {
    const data = installStorage()
    const f = await import('./favorites')
    f.toggleFavorite(a)
    f.toggleFavorite(b)
    f.toggleFavorite(b)
    expect(f.getFavorites()).toEqual([a])
    installStorage(Object.fromEntries(data))
    expect((await import('./favorites')).getFavorites()).toEqual([a])
  })
  it('is included in the backup and restored from it', async () => {
    const f = await import('./favorites')
    const s = await import('./sessions')
    f.toggleFavorite(a)
    const json = s.exportJson()
    expect(JSON.parse(json).favorites).toEqual([a])
    installStorage()
    const f2 = await import('./favorites')
    const s2 = await import('./sessions')
    s2.importJson(JSON.stringify({ sessions: [], favorites: [b, 'nope'] }))
    expect(f2.getFavorites()).toEqual([b])
  })
})
