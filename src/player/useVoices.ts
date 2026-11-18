import { useEffect, useState } from 'react'
import type { Locale } from '../i18n/core'
import { speechSupported } from './cues'
import { speechStatus, voicesFor, type SpeechStatus } from './voice'

const all = () => (speechSupported() ? speechSynthesis.getVoices() : [])

/** Voices for `language` on this device, plus a status (they load asynchronously in most browsers). */
export function useVoices(language: Locale): { voices: SpeechSynthesisVoice[]; status: SpeechStatus } {
  const [list, setList] = useState<SpeechSynthesisVoice[]>(all)
  const [waited, setWaited] = useState(false)
  useEffect(() => {
    if (!speechSupported()) return
    const update = () => setList(all())
    update()
    const timer = setTimeout(() => setWaited(true), 2000) // some browsers never report voices when none exist
    speechSynthesis.addEventListener('voiceschanged', update)
    return () => {
      clearTimeout(timer)
      speechSynthesis.removeEventListener('voiceschanged', update)
    }
  }, [])
  return { voices: voicesFor(list, language), status: waited && list.length === 0 ? 'no-voice' : speechStatus(speechSupported(), list, language) }
}
