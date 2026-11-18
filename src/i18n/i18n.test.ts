import { describe, expect, it } from 'vitest'
import { EXERCISES } from '../data/exercises'
import { STARTERS } from '../data/templates'
import { CATALOGS, LOCALES, detectLocale, matchLocale, starterName, translate, type Catalogs } from './core'
import { en } from './en'
import { EXERCISE_TEXT } from './exerciseText'

describe('translate', () => {
  it('translates, interpolates and picks plural forms', () => {
    expect(translate('en', 'sessions.summary', { count: 1, duration: '5 min' })).toBe('1 exercise · ~5 min')
    expect(translate('en', 'sessions.summary', { count: 3, duration: '5 min' })).toBe('3 exercises · ~5 min')
    expect(translate('nl', 'sessions.summary', { count: 2, duration: '5 min' })).toBe('2 oefeningen · ~5 min')
    expect(translate('nl', 'player.upNext', { name: 'Bilbrug' })).toBe('Hierna: Bilbrug')
  })
  it('falls back to English for a missing translation, and to the key for an unknown one', () => {
    const sparse: Catalogs = { en: { 'common.back': 'Back', 'common.done': 'Done' }, nl: { 'common.back': 'Terug' } }
    expect(translate('nl', 'common.back', undefined, sparse)).toBe('Terug')
    expect(translate('nl', 'common.done', undefined, sparse)).toBe('Done')
    expect(translate('nl', 'no.such.key', undefined, sparse)).toBe('no.such.key')
  })
  it('keeps unknown placeholders intact', () => {
    expect(translate('en', 'player.upNext', {})).toBe('Up next: {name}')
  })
})

describe('catalogs', () => {
  it('cover every English key in every locale (no silent fallbacks)', () => {
    for (const l of LOCALES) {
      const missing = Object.keys(en).filter((k) => !(k in CATALOGS[l]))
      expect(missing, l).toEqual([])
    }
  })
  it('have no stray keys and the same placeholders as English', () => {
    const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
    for (const l of LOCALES) {
      for (const [k, value] of Object.entries(CATALOGS[l])) {
        expect(k in en, `${l}:${k}`).toBe(true)
        expect(vars(value as string), `${l}:${k}`).toEqual(vars((en as Record<string, string>)[k]))
      }
    }
  })
})

describe('locale detection', () => {
  it('matches language tags and falls back to English', () => {
    expect(matchLocale('nl-BE')).toBe('nl')
    expect(matchLocale('fr-FR')).toBeUndefined()
    expect(detectLocale(['fr-FR', 'nl'])).toBe('nl')
    expect(detectLocale(['de'])).toBe('en')
  })
})

describe('exercise content', () => {
  it('has every non-English locale cover every exercise id with the same number of steps', () => {
    for (const l of LOCALES.filter((x) => x !== 'en')) {
      const text = EXERCISE_TEXT[l] ?? {}
      for (const e of EXERCISES) {
        expect(text[e.id], `${l}:${e.id}`).toBeDefined()
        expect(text[e.id].name.trim(), `${l}:${e.id}`).not.toBe('')
        expect(text[e.id].instructions.length, `${l}:${e.id}`).toBe(e.instructions.length)
      }
      expect(Object.keys(text).filter((id) => !EXERCISES.some((e) => e.id === id)), l).toEqual([])
    }
  })
})

describe('starter session names', () => {
  it('have a translation for every starter in every locale', () => {
    for (const s of STARTERS) for (const l of LOCALES) expect(CATALOGS[l][`starter.${s.id}` as keyof typeof en], `${l}:${s.id}`).toBeTruthy()
  })
  it('follow the language, but never overwrite a name the user edited', () => {
    const id = STARTERS[0].id
    expect(starterName('nl', id, STARTERS[0].name)).toBe(CATALOGS.nl[`starter.${id}` as keyof typeof en])
    expect(starterName('en', id, CATALOGS.nl[`starter.${id}` as keyof typeof en]!)).toBe(STARTERS[0].name)
    expect(starterName('nl', id, 'My own plan')).toBe('My own plan')
  })
  it('keep the English source name in sync with the catalog', () => {
    for (const s of STARTERS) expect(en[`starter.${s.id}` as keyof typeof en]).toBe(s.name)
  })
})
