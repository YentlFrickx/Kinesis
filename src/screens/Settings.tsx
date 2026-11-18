import { useState } from 'react'
import { Icon } from '../components/Icon'
import { Sheet } from '../components/Sheet'
import { exportJson, missingStarters, restoreStarters, useSessions } from '../store/sessions'
import { THEME_OPTIONS, setTheme, useTheme } from '../store/theme'
import { VoiceSettings } from './VoiceSettings'

/** App settings sheet: appearance, voice, and session backup. `onMessage` reports import/restore results. */
export function SettingsSheet({ onClose, onMessage, fileRef }: {
  onClose: () => void
  onMessage: (m: string) => void
  fileRef: React.RefObject<HTMLInputElement | null>
}) {
  const sessions = useSessions()
  const theme = useTheme()
  const [, force] = useState(0)

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportJson()], { type: 'application/json' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'kinesis-sessions.json' })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Sheet title="Settings" onClose={onClose}>
      <div className="opt" role="group" aria-label="Appearance">
        <Icon name="moon" size={20} />Appearance
        <div className="seg-pick">
          {THEME_OPTIONS.map((t) => (
            <button key={t} className={theme === t ? 'on' : ''} aria-pressed={theme === t} onClick={() => setTheme(t)}>{t}</button>
          ))}
        </div>
      </div>
      <VoiceSettings />
      <button className="opt" onClick={download} disabled={sessions.length === 0}><Icon name="download" size={20} />Export</button>
      <button className="opt" onClick={() => { onClose(); fileRef.current?.click() }}><Icon name="upload" size={20} />Import</button>
      {missingStarters(sessions).length > 0 && (
        <button className="opt" onClick={() => { onMessage(`Restored ${restoreStarters()} starter session(s).`); force((n) => n + 1) }}>
          <Icon name="refresh" size={20} />Restore starter sessions
        </button>
      )}
    </Sheet>
  )
}
