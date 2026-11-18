import { useRef, useState } from 'react'
import { Figure } from '../animation/Figure'
import { Icon } from '../components/Icon'
import { Sheet } from '../components/Sheet'
import { GoalRing } from '../components/GoalRing'
import { EXERCISE_MAP } from '../data/exercises'
import type { Session } from '../data/types'
import { formatDuration } from '../lib/format'
import { weekDays } from '../lib/progress'
import { go } from '../lib/router'
import { buildSteps, estimateSeconds } from '../player/engine'
import { youllNeed } from '../store/equipment'
import { useHistory } from '../store/history'
import { createSession, deleteSession, duplicateSession, importJson, useSessions } from '../store/sessions'
import { SettingsSheet } from './Settings'

const lookup = (id: string) => EXERCISE_MAP.get(id)
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function summary(s: Session) {
  const steps = buildSteps(s, lookup)
  const work = s.items.filter((i) => EXERCISE_MAP.has(i.exerciseId)).length
  return { steps, work, text: `${work} exercise${work === 1 ? '' : 's'} · ~${formatDuration(estimateSeconds(steps))}` }
}

type Sheeted = { kind: 'settings' } | { kind: 'menu'; id: string } | { kind: 'delete'; id: string } | null

export function Sessions() {
  const sessions = useSessions()
  const history = useHistory()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [sheet, setSheet] = useState<Sheeted>(null)
  const [now] = useState(Date.now)

  const onImport = async (file?: File) => {
    if (!file) return
    try {
      setMsg(`Imported ${importJson(await file.text())} session(s).`)
    } catch (err) {
      setMsg(`Import failed: ${(err as Error).message}`)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  // Suggest the session that has gone longest without being completed (never done counts as longest).
  const lastDone = (id: string) => history.find((h) => h.sessionId === id)?.completedAt ?? 0
  const playable = sessions.filter((s) => buildSteps(s, lookup).length > 0)
  const suggested = [...playable].sort((a, b) => lastDone(a.id) - lastDone(b.id))[0]
  const sug = suggested && summary(suggested)
  const firstEx = suggested && EXERCISE_MAP.get(suggested.items.find((i) => EXERCISE_MAP.has(i.exerciseId))!.exerciseId)
  const days = weekDays(history, now)
  const target = sheet && 'id' in sheet ? sessions.find((s) => s.id === sheet.id) : undefined
  const close = () => setSheet(null)

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="eyebrow">{new Date(now).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h1>Sessions</h1>
        </div>
        <button className="chip-btn" onClick={() => setSheet({ kind: 'settings' })}><Icon name="sliders" size={16} />Settings</button>
      </div>

      {msg && <p className="notice" role="status">{msg}</p>}

      {suggested && sug && firstEx && (
        <section className="hero" aria-label="Suggested session">
          <div className="eyebrow">Suggested today</div>
          <h2>{suggested.name}</h2>
          <span className="meta">{sug.text}{youllNeed(suggested) ? ` · ${youllNeed(suggested)}` : ''}</span>
          <div className="stage">
            <Figure frames={firstEx.animation} props={firstEx.props} gear={firstEx.gear} label={`${firstEx.name} animation`} />
          </div>
          <button className="btn primary" onClick={() => go(`/play/${suggested.id}`)}><Icon name="play" size={18} />Start session</button>
        </section>
      )}

      <div className="week">
        <GoalRing />
        <div className="days" role="group" aria-label="This week">
          {days.map((d, i) => (
            <div key={d.day} className={`day${d.count ? ' on' : ''}${d.today ? ' today' : ''}`}>
              <i aria-label={d.count ? `${d.count} session${d.count === 1 ? '' : 's'}` : undefined}>{d.count ? <Icon name="check" size={14} /> : null}</i>
              {DAY_LETTERS[i]}
            </div>
          ))}
        </div>
      </div>

      <div className="sec">
        <h2>Your sessions</h2>
        <button className="chip-btn" onClick={() => go(`/session/${createSession().id}`)}><Icon name="plus" size={16} />New</button>
      </div>
      {sessions.length === 0 && (
        <p className="empty">No sessions yet. Create one and pick exercises from the library.</p>
      )}
      <ul className="session-list">
        {sessions.map((s) => {
          const { steps, text } = summary(s)
          const ex = EXERCISE_MAP.get(s.items.find((i) => EXERCISE_MAP.has(i.exerciseId))?.exerciseId ?? '')
          return (
            <li key={s.id} className="row">
              <div className="th">
                {ex && <Figure frames={ex.animation} props={ex.props} gear={ex.gear} label={`${ex.name} illustration`} playing={false} />}
              </div>
              <div className="tx">
                <strong>{s.name}</strong>
                <div className="meta">{text}</div>
                {youllNeed(s) && <div className="gear-note">{youllNeed(s)}</div>}
              </div>
              <button className="icon-btn" aria-label={`More for ${s.name}`} onClick={() => setSheet({ kind: 'menu', id: s.id })}><Icon name="more" /></button>
              <button className="icon-btn fill" aria-label={`Start ${s.name}`} disabled={steps.length === 0} onClick={() => go(`/play/${s.id}`)}><Icon name="play" size={18} /></button>
            </li>
          )
        })}
      </ul>
      <button className="gen" onClick={() => go('/generate')}>
        <Icon name="spark" />
        <span><strong>Generate a session</strong>Pick time and focus, and we build it.</span>
      </button>

      <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => onImport(e.target.files?.[0])} />

      {sheet?.kind === 'settings' && <SettingsSheet onClose={close} onMessage={(m) => { setMsg(m); close() }} fileRef={fileRef} />}
      {sheet?.kind === 'menu' && target && (
        <Sheet title={target.name} onClose={close}>
          <button className="opt" onClick={() => go(`/session/${target.id}`)}><Icon name="edit" size={20} />Edit</button>
          <button className="opt" onClick={() => { duplicateSession(target.id); close() }}><Icon name="copy" size={20} />Duplicate</button>
          <button className="opt danger" onClick={() => setSheet({ kind: 'delete', id: target.id })}><Icon name="trash" size={20} />Delete</button>
        </Sheet>
      )}
      {sheet?.kind === 'delete' && target && (
        <Sheet title={`Delete "${target.name}"?`} onClose={close}>
          <p className="meta">This removes the session from this device. Export first if you want a copy.</p>
          <button className="btn primary" onClick={close}>Keep it</button>
          <button className="btn danger" onClick={() => { deleteSession(target.id); close() }}>Delete session</button>
        </Sheet>
      )}
    </div>
  )
}
