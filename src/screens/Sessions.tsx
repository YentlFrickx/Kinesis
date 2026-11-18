import { useRef, useState } from 'react'
import { EXERCISE_MAP } from '../data/exercises'
import { formatDuration } from '../lib/format'
import { go } from '../lib/router'
import { VoiceSettings } from './VoiceSettings'
import { buildSteps, estimateSeconds } from '../player/engine'
import {
  createSession, deleteSession, duplicateSession, exportJson, importJson, missingStarters, restoreStarters, useSessions,
} from '../store/sessions'

export function Sessions() {
  const sessions = useSessions()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportJson()], { type: 'application/json' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'kinesis-sessions.json' })
    a.click()
    URL.revokeObjectURL(url)
  }

  const onImport = async (file?: File) => {
    if (!file) return
    try {
      setMsg(`Imported ${importJson(await file.text())} session(s).`)
    } catch (err) {
      setMsg(`Import failed: ${(err as Error).message}`)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      <div className="head-row">
        <h1>Sessions</h1>
        <button className="btn primary" onClick={() => go(`/session/${createSession().id}`)}>+ New</button>
      </div>
      {sessions.length === 0 && (
        <p className="empty">No sessions yet. Create one and pick exercises from the library.</p>
      )}
      <ul className="session-list">
        {sessions.map((s) => {
          const steps = buildSteps(s, (id) => EXERCISE_MAP.get(id))
          const work = s.items.filter((i) => EXERCISE_MAP.has(i.exerciseId)).length
          return (
            <li key={s.id} className="card">
              <div className="session-top">
                <div>
                  <strong>{s.name}</strong>
                  <div className="meta">{work} exercise{work === 1 ? '' : 's'} · ~{formatDuration(estimateSeconds(steps))}</div>
                </div>
                <button className="btn primary" disabled={steps.length === 0} onClick={() => go(`/play/${s.id}`)}>▶ Start</button>
              </div>
              <div className="actions">
                <button className="btn small" onClick={() => go(`/session/${s.id}`)}>Edit</button>
                <button className="btn small" onClick={() => duplicateSession(s.id)}>Duplicate</button>
                <button className="btn small danger" onClick={() => confirm(`Delete "${s.name}"?`) && deleteSession(s.id)}>Delete</button>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="actions footer-actions">
        <button className="btn small" onClick={download} disabled={sessions.length === 0}>Export</button>
        <button className="btn small" onClick={() => fileRef.current?.click()}>Import</button>
        {missingStarters(sessions).length > 0 && (
          <button className="btn small" onClick={() => setMsg(`Restored ${restoreStarters()} starter session(s).`)}>Restore starter sessions</button>
        )}
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
      </div>
      {msg && <p className="meta" role="status">{msg}</p>}
      <VoiceSettings />
    </div>
  )
}
