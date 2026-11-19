import type { Locale } from '../i18n/core'

/** Minimal shape of SpeechSynthesisVoice that we rely on (keeps this module testable). */
export interface VoiceInfo {
  name: string
  lang: string
  voiceURI: string
  localService: boolean
}

const norm = (lang: string) => lang.toLowerCase().replace('_', '-')
const base = (lang: string) => norm(lang).split('-')[0]

/** Preferred regional variants per language, best first. */
const REGION_RANK: Record<Locale, string[]> = {
  en: ['en-gb', 'en-us'],
  nl: ['nl-nl', 'nl-be'],
}

const isLanguage = (v: Pick<VoiceInfo, 'lang'>, language: Locale) => base(v.lang) === language

/** Voices for one language only, best first: preferred region, then other regions; on-device before network voices. */
export function voicesFor<T extends VoiceInfo>(voices: readonly T[], language: Locale): T[] {
  const ranks = REGION_RANK[language]
  const rank = (v: T) => {
    const i = ranks.indexOf(norm(v.lang))
    return (i === -1 ? ranks.length : i) * 2 + (v.localService ? 0 : 1)
  }
  return voices.filter((v) => isLanguage(v, language)).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
}

export const englishVoices = <T extends VoiceInfo>(voices: readonly T[]) => voicesFor(voices, 'en')

/** The saved voice if it is still available for that language, otherwise the best voice for it, otherwise undefined. */
export function pickVoice<T extends VoiceInfo>(voices: readonly T[], language: Locale, preferredURI?: string | null): T | undefined {
  const list = voicesFor(voices, language)
  return list.find((v) => v.voiceURI === preferredURI) ?? list[0]
}

export type SpeechStatus = 'unsupported' | 'loading' | 'no-voice' | 'ready'

/** What the UI should tell the user: `loading` while the browser has not reported any voices yet. */
export function speechStatus(supported: boolean, voices: readonly VoiceInfo[], language: Locale): SpeechStatus {
  if (!supported) return 'unsupported'
  if (voices.length === 0) return 'loading'
  return voicesFor(voices, language).length > 0 ? 'ready' : 'no-voice'
}

// ---- cue scheduling ----
export type CuePriority = 'step' | 'count'
export type CueAction = 'speak' | 'interrupt' | 'queue' | 'drop'

/**
 * Decides what to do with a new cue given what is being spoken. Short cues must not be clipped by a blind cancel():
 * - nothing playing → speak
 * - `interrupt` (the user skipped, so the current cue is stale) → cut in
 * - a count while anything is playing → drop (it would be late)
 * - a step announcement over a count → cut the count off
 * - a step announcement over another step → wait for it (only the latest waiting one is kept)
 */
export function scheduleCue(current: CuePriority | null, cue: { priority: CuePriority; interrupt?: boolean }): CueAction {
  if (current === null) return 'speak'
  if (cue.interrupt) return 'interrupt'
  if (cue.priority === 'count') return 'drop'
  return current === 'count' ? 'interrupt' : 'queue'
}

// ---- settings ----
export type Verbosity = 'names' | 'countdown' | 'reps'
export const VERBOSITIES: readonly Verbosity[] = ['names', 'countdown', 'reps']

export interface SpeechSettings {
  rate: number
  volume: number
  verbosity: Verbosity
  /** Chosen voice per language. */
  voices: Partial<Record<Locale, string>>
}

export const RATE_RANGE = { min: 0.7, max: 1.4, step: 0.1 } as const
const DEFAULT_SPEECH: SpeechSettings = { rate: 1, volume: 1, verbosity: 'reps', voices: {} }

const clamp = (n: unknown, min: number, max: number, fallback: number) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback

/** Validates stored settings so a corrupted value can never break speech. */
export function parseSpeechSettings(raw: unknown): SpeechSettings {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const voices: SpeechSettings['voices'] = {}
  if (o.voices && typeof o.voices === 'object') {
    for (const [k, v] of Object.entries(o.voices)) if ((k === 'en' || k === 'nl') && typeof v === 'string') voices[k] = v
  }
  return {
    rate: clamp(o.rate, RATE_RANGE.min, RATE_RANGE.max, DEFAULT_SPEECH.rate),
    volume: clamp(o.volume, 0, 1, DEFAULT_SPEECH.volume),
    verbosity: VERBOSITIES.includes(o.verbosity as Verbosity) ? (o.verbosity as Verbosity) : DEFAULT_SPEECH.verbosity,
    voices,
  }
}

/** Whether a kind of cue is spoken at the given verbosity (levels are cumulative). */
export const speaksCountdown = (v: Verbosity) => v !== 'names'
export const speaksReps = (v: Verbosity) => v === 'reps'
