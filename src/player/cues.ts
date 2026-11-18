import { pickVoice } from './voice'

const MUTE_KEY = 'rw.muted'
const VOICE_KEY = 'rw.voice'
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

export const getVoiceURI = (): string | null => {
  try { return localStorage.getItem(VOICE_KEY) } catch { return null }
}
export const setVoiceURI = (uri: string | null) => {
  try {
    if (uri) localStorage.setItem(VOICE_KEY, uri)
    else localStorage.removeItem(VOICE_KEY)
  } catch { /* ignore */ }
}

export const speechSupported = () => typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined'

/** Speaks `text` in English, using the chosen voice (or the best English one). `force` ignores the mute toggle. */
export function speak(text: string, opts: { force?: boolean } = {}) {
  if ((isMuted() && !opts.force) || !speechSupported()) return
  try {
    const u = new SpeechSynthesisUtterance(text)
    const voice = pickVoice(speechSynthesis.getVoices(), getVoiceURI())
    if (voice) u.voice = voice
    u.lang = voice?.lang ?? 'en-GB' // forces English even when no English voice is listed yet
    speechSynthesis.cancel()
    speechSynthesis.speak(u)
  } catch { /* ignore */ }
}

export function stopSpeaking() {
  try { speechSynthesis?.cancel() } catch { /* ignore */ }
}

export const vibrate = (pattern: number | number[]) => {
  try { navigator.vibrate?.(pattern) } catch { /* ignore */ }
}
