const MUTE_KEY = 'rw.muted'

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

export function speak(text: string) {
  if (isMuted() || typeof speechSynthesis === 'undefined') return
  try {
    speechSynthesis.cancel()
    speechSynthesis.speak(new SpeechSynthesisUtterance(text))
  } catch { /* ignore */ }
}

export function stopSpeaking() {
  try { speechSynthesis?.cancel() } catch { /* ignore */ }
}

export const vibrate = (pattern: number | number[]) => {
  try { navigator.vibrate?.(pattern) } catch { /* ignore */ }
}
