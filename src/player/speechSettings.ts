import { useSyncExternalStore } from 'react'
import type { Locale } from '../i18n/core'
import { parseSpeechSettings, type SpeechSettings } from './voice'

const KEY = 'rw.speech.v1'
const LEGACY_VOICE_KEY = 'rw.voice' // pre-i18n: a single (English) voice

function read(): SpeechSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (stored) return parseSpeechSettings(stored)
    const legacy = localStorage.getItem(LEGACY_VOICE_KEY)
    return parseSpeechSettings(legacy ? { voices: { en: legacy } } : null)
  } catch {
    return parseSpeechSettings(null)
  }
}

let settings = read()
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const getSpeechSettings = () => settings
export const useSpeechSettings = () => useSyncExternalStore(subscribe, () => settings)

export function updateSpeechSettings(patch: Partial<Omit<SpeechSettings, 'voices'>>) {
  commit({ ...settings, ...patch })
}

/** Saves (or clears, with null) the chosen voice for one language. */
export function setVoiceFor(language: Locale, uri: string | null) {
  const voices = { ...settings.voices }
  if (uri) voices[language] = uri
  else delete voices[language]
  commit({ ...settings, voices })
}

function commit(next: SpeechSettings) {
  settings = parseSpeechSettings(next)
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch { /* in-memory only */ }
  listeners.forEach((l) => l())
}
