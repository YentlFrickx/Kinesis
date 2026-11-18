import { describe, expect, it } from 'vitest'
import { englishVoices, pickVoice, type VoiceInfo } from './voice'

const v = (name: string, lang: string, localService = true): VoiceInfo => ({ name, lang, voiceURI: name, localService })
const voices = [
  v('Dutch', 'nl-BE'), v('US net', 'en-US', false), v('US local', 'en-US'),
  v('AU', 'en-AU'), v('GB net', 'en_GB', false), v('French', 'fr-FR'),
]

describe('voice selection', () => {
  it('keeps only English voices, best first', () => {
    expect(englishVoices(voices).map((x) => x.name)).toEqual(['GB net', 'US local', 'US net', 'AU'])
  })
  it('uses the saved voice when available', () => {
    expect(pickVoice(voices, 'AU')?.name).toBe('AU')
  })
  it('ignores a saved non-English or missing voice', () => {
    expect(pickVoice(voices, 'Dutch')?.name).toBe('GB net')
    expect(pickVoice(voices, 'gone')?.name).toBe('GB net')
  })
  it('returns undefined when no English voice exists', () => {
    expect(pickVoice([v('Dutch', 'nl-BE')], null)).toBeUndefined()
  })
})
