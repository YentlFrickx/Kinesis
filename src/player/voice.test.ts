import { describe, expect, it } from 'vitest'
import { englishVoices, parseSpeechSettings, pickVoice, scheduleCue, speaksCountdown, speaksReps, speechStatus, voicesFor, type VoiceInfo } from './voice'

const v = (name: string, lang: string, localService = true): VoiceInfo => ({ name, lang, voiceURI: name, localService })
const voices = [
  v('Dutch BE', 'nl-BE'), v('Dutch NL net', 'nl-NL', false), v('Dutch NL', 'nl_NL'),
  v('US net', 'en-US', false), v('US local', 'en-US'),
  v('AU', 'en-AU'), v('GB net', 'en_GB', false), v('French', 'fr-FR'),
]

describe('voice selection', () => {
  it('keeps only English voices, best first', () => {
    expect(englishVoices(voices).map((x) => x.name)).toEqual(['GB net', 'US local', 'US net', 'AU'])
  })
  it('keeps only Dutch voices, nl-NL first, on-device before network', () => {
    expect(voicesFor(voices, 'nl').map((x) => x.name)).toEqual(['Dutch NL', 'Dutch NL net', 'Dutch BE'])
  })
  it('uses the saved voice when available for that language', () => {
    expect(pickVoice(voices, 'en', 'AU')?.name).toBe('AU')
    expect(pickVoice(voices, 'nl', 'Dutch BE')?.name).toBe('Dutch BE')
  })
  it('ignores a saved voice of another language or a missing one', () => {
    expect(pickVoice(voices, 'en', 'Dutch BE')?.name).toBe('GB net')
    expect(pickVoice(voices, 'nl', 'AU')?.name).toBe('Dutch NL')
    expect(pickVoice(voices, 'en', 'gone')?.name).toBe('GB net')
  })
  it('returns undefined when no voice for the language exists', () => {
    expect(pickVoice([v('Dutch', 'nl-BE')], 'en', null)).toBeUndefined()
    expect(pickVoice([v('US', 'en-US')], 'nl', null)).toBeUndefined()
  })
})

describe('speech status', () => {
  it('reports unsupported, loading, no-voice and ready', () => {
    expect(speechStatus(false, voices, 'nl')).toBe('unsupported')
    expect(speechStatus(true, [], 'nl')).toBe('loading')
    expect(speechStatus(true, [v('US', 'en-US')], 'nl')).toBe('no-voice')
    expect(speechStatus(true, voices, 'nl')).toBe('ready')
  })
})

describe('cue scheduling', () => {
  it('speaks right away when idle', () => {
    expect(scheduleCue(null, { priority: 'step' })).toBe('speak')
    expect(scheduleCue(null, { priority: 'count' })).toBe('speak')
  })
  it('does not clip a step announcement with a later one: it queues', () => {
    expect(scheduleCue('step', { priority: 'step' })).toBe('queue')
  })
  it('drops late countdown numbers instead of cutting speech', () => {
    expect(scheduleCue('step', { priority: 'count' })).toBe('drop')
    expect(scheduleCue('count', { priority: 'count' })).toBe('drop')
  })
  it('lets a step announcement cut off a stale count', () => {
    expect(scheduleCue('count', { priority: 'step' })).toBe('interrupt')
  })
  it('interrupts on request (user skipped)', () => {
    expect(scheduleCue('step', { priority: 'step', interrupt: true })).toBe('interrupt')
  })
})

describe('speech settings', () => {
  it('falls back to defaults for garbage', () => {
    expect(parseSpeechSettings(null)).toEqual({ rate: 1, volume: 1, verbosity: 'reps', voices: {} })
    expect(parseSpeechSettings({ rate: 'fast', volume: NaN, verbosity: 'loud', voices: 3 })).toEqual({ rate: 1, volume: 1, verbosity: 'reps', voices: {} })
  })
  it('clamps rate and volume and keeps valid voices', () => {
    const s = parseSpeechSettings({ rate: 9, volume: -1, verbosity: 'names', voices: { nl: 'x', en: 5, de: 'y' } })
    expect(s).toEqual({ rate: 1.4, volume: 0, verbosity: 'names', voices: { nl: 'x' } })
  })
  it('verbosity levels are cumulative', () => {
    expect([speaksCountdown('names'), speaksCountdown('countdown'), speaksCountdown('reps')]).toEqual([false, true, true])
    expect([speaksReps('names'), speaksReps('countdown'), speaksReps('reps')]).toEqual([false, false, true])
  })
})
