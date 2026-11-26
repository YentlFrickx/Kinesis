import { en, type MessageKey } from './en'
import { nl } from './nl'

export type Locale = 'en' | 'nl'
export const LOCALES: readonly Locale[] = ['en', 'nl']
/** Language names in their own language, plus the BCP-47 tag used for speech and Intl. */
export const LOCALE_INFO: Record<Locale, { native: string; tag: string }> = {
  en: { native: 'English', tag: 'en-GB' },
  nl: { native: 'Nederlands', tag: 'nl-NL' },
}
export const DEFAULT_LOCALE: Locale = 'en'

/** Base of a pluralised key: `sessions.summary` for `sessions.summary_one` / `_other`. */
export type PluralKey = MessageKey extends infer K ? (K extends `${infer B}_${'one' | 'other'}` ? B : never) : never
/** Any key `t()` accepts. */
export type TranslationKey = MessageKey | PluralKey

export type Params = Record<string, string | number>
export type Catalog = Partial<Record<MessageKey, string>>
export type Catalogs = Record<Locale, Catalog>
export const CATALOGS: Catalogs = { en, nl }

/** Maps a browser language tag (e.g. "nl-BE", "fr") to a supported locale, or undefined. */
export function matchLocale(tag: string | undefined | null): Locale | undefined {
  const base = tag?.toLowerCase().split(/[-_]/)[0]
  return LOCALES.find((l) => l === base)
}

/** First supported language among the browser's preferences, else English. */
export function detectLocale(languages: readonly string[]): Locale {
  for (const tag of languages) {
    const m = matchLocale(tag)
    if (m) return m
  }
  return DEFAULT_LOCALE
}

// Building PluralRules is comparatively slow and translate() runs on every render (the player re-renders ~10×/s).
const pluralRules = new Map<Locale, Intl.PluralRules>()
const pluralOf = (locale: Locale, n: number) => {
  let rules = pluralRules.get(locale)
  if (!rules) pluralRules.set(locale, (rules = new Intl.PluralRules(LOCALE_INFO[locale].tag)))
  return rules.select(n)
}

const fill = (s: string, params?: Params) =>
  params ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m)) : s

/**
 * Looks up `key` in the locale's catalog, falling back to English and finally to the key itself.
 * With a numeric `count` param, `key_one` / `key_other` (per Intl.PluralRules) are preferred.
 */
export function translate(locale: Locale, key: MessageKey | string, params?: Params, catalogs: Catalogs = CATALOGS): string {
  const lookup = (k: string): string | undefined =>
    (catalogs[locale] as Record<string, string | undefined>)[k] ?? (catalogs[DEFAULT_LOCALE] as Record<string, string | undefined>)[k]
  let found: string | undefined
  if (typeof params?.count === 'number') {
    const rule = pluralOf(locale, params.count)
    found = lookup(`${key}_${rule}`) ?? lookup(`${key}_other`)
  }
  return fill(found ?? lookup(key) ?? key, params)
}

/** The display name of a starter session: translated unless the user renamed it. */
export function starterName(locale: Locale, id: string, stored: string, catalogs: Catalogs = CATALOGS): string {
  const key = `starter.${id}`
  const isDefault = LOCALES.some((l) => (catalogs[l] as Record<string, string | undefined>)[key] === stored)
  return isDefault ? translate(locale, key, undefined, catalogs) : stored
}
