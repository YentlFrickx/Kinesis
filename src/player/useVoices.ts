import { useEffect, useState } from 'react'
import { speechSupported } from './cues'
import { englishVoices } from './voice'

/** English voices available on this device (they load asynchronously in most browsers). */
export function useEnglishVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => (speechSupported() ? englishVoices(speechSynthesis.getVoices()) : []))
  useEffect(() => {
    if (!speechSupported()) return
    const update = () => setVoices(englishVoices(speechSynthesis.getVoices()))
    update()
    speechSynthesis.addEventListener('voiceschanged', update)
    return () => speechSynthesis.removeEventListener('voiceschanged', update)
  }, [])
  return voices
}
