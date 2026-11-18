/** Minimal shape of SpeechSynthesisVoice that we rely on (keeps this module testable). */
export interface VoiceInfo {
  name: string
  lang: string
  voiceURI: string
  localService: boolean
}

export const isEnglish = (v: Pick<VoiceInfo, 'lang'>) => /^en([-_]|$)/i.test(v.lang)

const LANG_RANK = ['en-gb', 'en-us']

/** English voices only, best first: en-GB, en-US, other English; on-device voices before network ones. */
export function englishVoices<T extends VoiceInfo>(voices: readonly T[]): T[] {
  const rank = (v: T) => {
    const i = LANG_RANK.indexOf(v.lang.toLowerCase().replace('_', '-'))
    return (i === -1 ? LANG_RANK.length : i) * 2 + (v.localService ? 0 : 1)
  }
  return voices.filter(isEnglish).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
}

/** The saved voice if it is still available (and English), otherwise the best English voice, otherwise undefined. */
export function pickVoice<T extends VoiceInfo>(voices: readonly T[], preferredURI?: string | null): T | undefined {
  const english = englishVoices(voices)
  return english.find((v) => v.voiceURI === preferredURI) ?? english[0]
}
