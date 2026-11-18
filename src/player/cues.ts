import { LOCALE_INFO } from '../i18n/core'
import { getLocale } from '../i18n'
import { getSpeechSettings } from './speechSettings'
import { pickVoice, scheduleCue, voicesFor, type CuePriority } from './voice'

const MUTE_KEY = 'rw.muted'
const AUTO_REPS_KEY = 'rw.autoReps'

/** Auto-advance rep steps at SECONDS_PER_REP (off by default: tap "Done" instead). */
export const getAutoReps = (): boolean => {
  try { return localStorage.getItem(AUTO_REPS_KEY) === '1' } catch { return false }
}
export const setAutoReps = (on: boolean) => {
  try { localStorage.setItem(AUTO_REPS_KEY, on ? '1' : '0') } catch { /* ignore */ }
}

export const isMuted = (): boolean => {
  try { return localStorage.getItem(MUTE_KEY) === '1' } catch { return false }
}
export const setMuted = (m: boolean) => {
  try { localStorage.setItem(MUTE_KEY, m ? '1' : '0') } catch { /* ignore */ }
  if (m) stopSpeaking()
}

let ctx: AudioContext | null = null
function audio(): AudioContext | null {
  try {
    ctx ??= new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

export function beep(freq = 880, ms = 120) {
  if (isMuted()) return
  const a = audio()
  if (!a) return
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.15, a.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + ms / 1000)
  osc.connect(gain).connect(a.destination)
  osc.start()
  osc.stop(a.currentTime + ms / 1000)
}

export const speechSupported = () => typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined'

/** True when a spoken cue could be heard: supported, not muted, and (once voices are known) a voice exists for the language. */
export function canSpeak(): boolean {
  if (isMuted() || !speechSupported()) return false
  const voices = speechSynthesis.getVoices()
  return voices.length === 0 || voicesFor(voices, getLocale()).length > 0
}

// One cue plays at a time. Step announcements wait for the previous one instead of cutting it off;
// countdown/rep numbers are dropped when they would be late (see scheduleCue).
const STALE_MS = 8000 // some engines never fire `end`; do not stay "busy" forever
let current: { priority: CuePriority; startedAt: number } | null = null
let queued: { text: string; opts: SpeakOptions } | null = null

export interface SpeakOptions {
  /** Ignore the mute toggle (used by "Test voice"). */
  force?: boolean
  priority?: CuePriority
  /** Cut off whatever is playing, e.g. because the user skipped a step. */
  interrupt?: boolean
}

function busy(): CuePriority | null {
  if (current && Date.now() - current.startedAt > STALE_MS) current = null
  return current?.priority ?? null
}

function play(text: string, opts: SpeakOptions): boolean {
  const language = getLocale()
  const settings = getSpeechSettings()
  const voices = speechSynthesis.getVoices()
  const voice = pickVoice(voices, language, settings.voices[language])
  if (voices.length > 0 && !voice) return false // no voice for this language: beeps only
  const u = new SpeechSynthesisUtterance(text)
  if (voice) u.voice = voice
  u.lang = voice?.lang ?? LOCALE_INFO[language].tag
  u.rate = settings.rate
  u.volume = settings.volume
  const mine = { priority: opts.priority ?? 'step', startedAt: Date.now() }
  current = mine
  const finished = () => {
    if (current !== mine) return
    current = null
    if (queued) {
      const next = queued
      queued = null
      try { play(next.text, next.opts) } catch { /* ignore */ }
    }
  }
  u.onend = finished
  u.onerror = finished
  speechSynthesis.resume() // some browsers leave the engine paused after a long idle
  speechSynthesis.speak(u)
  return true
}

/** Speaks `text` in the selected language. Returns false when nothing was (or will be) spoken. */
export function speak(text: string, opts: SpeakOptions = {}): boolean {
  if ((isMuted() && !opts.force) || !speechSupported()) return false
  try {
    const action = scheduleCue(busy(), { priority: opts.priority ?? 'step', interrupt: opts.interrupt })
    if (action === 'drop') return false
    if (action === 'queue') {
      queued = { text, opts }
      return true
    }
    if (action === 'interrupt') {
      queued = null
      current = null
      speechSynthesis.cancel()
    }
    return play(text, opts)
  } catch {
    return false
  }
}

export function stopSpeaking() {
  current = null
  queued = null
  try { speechSynthesis?.cancel() } catch { /* ignore */ }
}

let primed = false
/** iOS only allows speech after a user gesture: speak a silent utterance (and resume audio) on the first one. */
export function primeSpeech() {
  if (primed) return
  primed = true
  audio()
  if (!speechSupported()) return
  try {
    const u = new SpeechSynthesisUtterance(' ')
    u.volume = 0
    speechSynthesis.speak(u)
  } catch { /* ignore */ }
}

export function installSpeechPrime() {
  const events = ['pointerdown', 'touchend', 'keydown', 'click'] as const
  const handler = () => {
    primeSpeech()
    events.forEach((e) => document.removeEventListener(e, handler, true))
  }
  events.forEach((e) => document.addEventListener(e, handler, true))
}

export const vibrate = (pattern: number | number[]) => {
  try { navigator.vibrate?.(pattern) } catch { /* ignore */ }
}
