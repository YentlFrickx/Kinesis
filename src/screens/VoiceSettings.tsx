import { useState } from 'react'
import { Icon } from '../components/Icon'
import { getVoiceURI, setVoiceURI, speak, speechSupported } from '../player/cues'
import { useEnglishVoices } from '../player/useVoices'

export function VoiceSettings() {
  const voices = useEnglishVoices()
  const [uri, setUri] = useState(() => getVoiceURI() ?? '')

  if (!speechSupported()) return <p className="meta">Voice cues are not supported in this browser. Beeps still work.</p>

  const selected = voices.some((v) => v.voiceURI === uri) ? uri : ''
  const test = (u: string) => {
    setVoiceURI(u || null)
    speak('Switch sides. Next up, forearm plank.', { force: true })
  }

  return (
    <div className="opt" style={{ display: 'block' }}>
      <label htmlFor="voice-select"><strong>Voice cues</strong> <span className="meta">(English)</span></label>
      <div className="voice-row">
        <select id="voice-select" value={selected}
          onChange={(e) => { setUri(e.target.value); test(e.target.value) }}>
          <option value="">Automatic (best English voice)</option>
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
          ))}
        </select>
        <button className="btn small" onClick={() => test(selected)}><Icon name="play" size={14} />Test</button>
      </div>
      {voices.length === 0 && (
        <p className="meta">No English voice found on this device yet. Cues will use the device default in English where possible.</p>
      )}
    </div>
  )
}
