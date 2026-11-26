import { useEffect, useRef, useState } from 'react'
import { Figure } from '../animation/Figure'
import { Icon } from '../components/Icon'
import { Sheet } from '../components/Sheet'
import { GoalRing } from '../components/GoalRing'
import { EXERCISE_MAP, withGear } from '../data/exercises'
import type { Session } from '../data/types'
import { formatDate, formatDuration, weekdayLetters } from '../lib/format'
import { sessionLabel, useLocalize, useT } from '../i18n'
import { weekDays } from '../lib/progress'
import { useToday } from '../lib/today'
import { go } from '../lib/router'
import { buildSteps, estimateSeconds } from '../player/engine'
import { youllNeed } from '../store/equipment'
import { useHistory } from '../store/history'
import { clearRun, startSession, useSavedRun, validateRun } from '../store/run'
import { createSession, deleteSession, duplicateSession, importJson, restoreSession, sessionIndex, useSessions } from '../store/sessions'
import { showToast } from '../store/toast'
import { SettingsSheet } from './Settings'

const lookup = (id: string) => EXERCISE_MAP.get(id)

/** Steps, summary line, equipment note and the first exercise (with its chosen gear, for the thumbnail). */
function summary(s: Session, t: ReturnType<typeof useT>) {
  const steps = buildSteps(s, lookup)
  const count = s.items.filter((i) => EXERCISE_MAP.has(i.exerciseId)).length
  const item = s.items.find((i) => EXERCISE_MAP.has(i.exerciseId))
  return {
    steps,
    text: t('sessions.summary', { count, duration: formatDuration(estimateSeconds(steps)) }),
    need: youllNeed(s),
    first: item && withGear(EXERCISE_MAP.get(item.exerciseId)!, item.gear),
  }
}

type Sheeted = { kind: 'settings' } | { kind: 'menu'; id: string } | { kind: 'delete'; id: string } | null

export function Sessions() {
  const t = useT()
  const lx = useLocalize()
  const sessions = useSessions()
  const history = useHistory()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [sheet, setSheet] = useState<Sheeted>(null)
  const now = useToday()
  const savedRun = useSavedRun()
  const resumeSession = savedRun ? sessions.find((s) => s.id === savedRun.sessionId) : undefined
  const resumeSteps = resumeSession ? buildSteps(resumeSession, lookup) : []
  const resumable = validateRun(savedRun, resumeSession, resumeSteps.length)
  // Drop a saved run that can no longer be resumed (session edited/deleted, or stale).
  useEffect(() => { if (savedRun && !resumable) clearRun() }, [savedRun, resumable])

  const onImport = async (file?: File) => {
    if (!file) return
    try {
      setMsg(t('msg.imported', { count: importJson(await file.text()) }))
    } catch (err) {
      setMsg(t('msg.importFailed', { error: (err as Error).message }))
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  // Suggest the session that has gone longest without being completed (never done counts as longest).
  const lastDone = (id: string) => history.find((h) => h.sessionId === id)?.completedAt ?? 0
  const summaries = new Map(sessions.map((s) => [s.id, summary(s, t)]))
  const playable = sessions.filter((s) => summaries.get(s.id)!.steps.length > 0)
  const suggested = [...playable].sort((a, b) => lastDone(a.id) - lastDone(b.id))[0]
  const sug = suggested && summaries.get(suggested.id)
  const firstEx = sug?.first && lx(sug.first)
  const days = weekDays(history, now)
  const letters = weekdayLetters()
  const target = sheet && 'id' in sheet ? sessions.find((s) => s.id === sheet.id) : undefined
  const close = () => setSheet(null)

  return (
    <div>
      <div className="page-top">
        <div>
          <div className="eyebrow">{formatDate(now, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h1>{t('sessions.title')}</h1>
        </div>
        <button className="chip-btn" onClick={() => setSheet({ kind: 'settings' })}><Icon name="sliders" size={16} />{t('settings.open')}</button>
      </div>

      {msg && <p className="notice" role="status">{msg}</p>}

      {resumable && resumeSession && (
        <section className="hero resume" aria-label={t('resume.title', { name: sessionLabel(resumeSession.id, resumeSession.name) })}>
          <div className="eyebrow">{t('resume.step', { n: resumable.index + 1, total: resumeSteps.length })}</div>
          <h2>{t('resume.title', { name: sessionLabel(resumeSession.id, resumeSession.name) })}</h2>
          <button className="btn primary" onClick={() => go(`/play/${resumeSession.id}`)}><Icon name="play" size={18} />{t('resume.resume')}</button>
          <button className="btn wide" onClick={clearRun}>{t('resume.discard')}</button>
        </section>
      )}

      {suggested && sug && firstEx && (
        <section className="hero" aria-label={t('sessions.suggestedAria')}>
          <div className="eyebrow">{t('sessions.suggested')}</div>
          <h2>{sessionLabel(suggested.id, suggested.name)}</h2>
          <span className="meta">{sug.text}{sug.need ? ` · ${sug.need}` : ''}</span>
          <div className="stage">
            <Figure frames={firstEx.animation} props={firstEx.props} gear={firstEx.gear} label={t('sessions.animation', { name: firstEx.name })} />
          </div>
          <button className="btn primary" onClick={() => startSession(suggested.id)}><Icon name="play" size={18} />{t('sessions.start')}</button>
        </section>
      )}

      <div className="week">
        <GoalRing />
        <div className="days" role="group" aria-label={t('sessions.thisWeek')}>
          {days.map((d, i) => (
            <div key={d.day} className={`day${d.count ? ' on' : ''}${d.today ? ' today' : ''}`}>
              <i aria-label={d.count ? t('sessions.sessionCount', { count: d.count }) : undefined}>{d.count ? <Icon name="check" size={14} /> : null}</i>
              {letters[i]}
            </div>
          ))}
        </div>
      </div>

      <div className="sec">
        <h2>{t('sessions.yours')}</h2>
        <button className="chip-btn" onClick={() => go(`/session/${createSession().id}`)}><Icon name="plus" size={16} />{t('common.new')}</button>
      </div>
      {sessions.length === 0 && (
        <p className="empty">{t('sessions.empty')}</p>
      )}
      <ul className="session-list">
        {sessions.map((s) => {
          const { steps, text, need, first } = summaries.get(s.id)!
          const ex = first && lx(first)
          return (
            <li key={s.id} className="row">
              <div className="th">
                {ex && <Figure frames={ex.animation} props={ex.props} gear={ex.gear} label={t('sessions.illustration', { name: ex.name })} playing={false} />}
              </div>
              <div className="tx">
                <strong>{sessionLabel(s.id, s.name)}</strong>
                <div className="meta">{text}</div>
                {need && <div className="gear-note">{need}</div>}
              </div>
              <button className="icon-btn" aria-label={t('sessions.moreFor', { name: sessionLabel(s.id, s.name) })} onClick={() => setSheet({ kind: 'menu', id: s.id })}><Icon name="more" /></button>
              <button className="icon-btn fill" aria-label={t('sessions.startNamed', { name: sessionLabel(s.id, s.name) })} disabled={steps.length === 0} onClick={() => startSession(s.id)}><Icon name="play" size={18} /></button>
            </li>
          )
        })}
      </ul>
      <button className="gen" onClick={() => go('/generate')}>
        <Icon name="spark" />
        <span><strong>{t('sessions.generate')}</strong>{t('sessions.generateHint')}</span>
      </button>

      <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => onImport(e.target.files?.[0])} />

      {sheet?.kind === 'settings' && <SettingsSheet onClose={close} onMessage={(m) => { setMsg(m); close() }} fileRef={fileRef} />}
      {sheet?.kind === 'menu' && target && (
        <Sheet title={sessionLabel(target.id, target.name)} onClose={close}>
          <button className="opt" onClick={() => go(`/session/${target.id}`)}><Icon name="edit" size={20} />{t('common.edit')}</button>
          <button className="opt" onClick={() => { const label = sessionLabel(target.id, target.name)
            const copy = duplicateSession(target.id, `${label} ${t('sessions.copySuffix')}`)
            if (copy) showToast(t('sessions.duplicated', { name: label }), () => deleteSession(copy.id))
            close() }}><Icon name="copy" size={20} />{t('common.duplicate')}</button>
          <button className="opt danger" onClick={() => setSheet({ kind: 'delete', id: target.id })}><Icon name="trash" size={20} />{t('common.delete')}</button>
        </Sheet>
      )}
      {sheet?.kind === 'delete' && target && (
        <Sheet title={t('sessions.deleteTitle', { name: sessionLabel(target.id, target.name) })} onClose={close}>
          <p className="meta">{t('sessions.deleteBody')}</p>
          <button className="btn primary" onClick={close}>{t('sessions.keep')}</button>
          <button className="btn danger" onClick={() => {
            const snapshot = target
            const at = sessionIndex(target.id)
            deleteSession(target.id)
            showToast(t('sessions.deleted', { name: sessionLabel(snapshot.id, snapshot.name) }), () => restoreSession(snapshot, at))
            close() }}>{t('sessions.deleteConfirm')}</button>
        </Sheet>
      )}
    </div>
  )
}
