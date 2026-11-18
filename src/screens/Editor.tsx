import { useState } from 'react'
import { Figure } from '../animation/Figure'
import { Icon } from '../components/Icon'
import { sessionLabel, useLocalize, useT } from '../i18n'
import { EXERCISE_MAP } from '../data/exercises'
import type { Exercise, Session, SessionItem } from '../data/types'
import { describe, formatDuration } from '../lib/format'
import { go } from '../lib/router'
import { buildSteps, estimateSeconds } from '../player/engine'
import { youllNeed } from '../store/equipment'
import { getSession, updateSession, useSessions } from '../store/sessions'
import { ExerciseBrowser } from './ExerciseBrowser'

function Stepper({ label, value, min, max, step, suffix, onChange }: {
  label: string; value: number; min: number; max: number; step: number; suffix?: string
  onChange: (v: number) => void
}) {
  const t = useT()
  const set = (v: number) => onChange(Math.min(max, Math.max(min, v)))
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button className="btn small" onClick={() => set(value - step)} disabled={value <= min} aria-label={t('editor.decrease', { label })}><Icon name="minus" size={16} /></button>
      <span className="stepper-val">{value}{suffix}</span>
      <button className="btn small" onClick={() => set(value + step)} disabled={value >= max} aria-label={t('editor.increase', { label })}><Icon name="plus" size={16} /></button>
    </div>
  )
}

export function Editor({ id }: { id: string }) {
  useSessions() // re-render on changes
  const t = useT()
  const lx = useLocalize()
  const session = getSession(id)
  const [picking, setPicking] = useState(false)

  if (!session) {
    return (
      <div>
        <p className="empty">{t('editor.notFound')}</p>
        <button className="btn" onClick={() => go('/')}>{t('common.back')}</button>
      </div>
    )
  }

  const patch = (fn: (s: Session) => Session) => updateSession(id, fn)
  const setItem = (idx: number, p: Partial<SessionItem>) =>
    patch((s) => ({ ...s, items: s.items.map((it, i) => (i === idx ? { ...it, ...p } : it)) }))
  const move = (idx: number, dir: -1 | 1) =>
    patch((s) => {
      const items = [...s.items]
      const j = idx + dir
      if (j < 0 || j >= items.length) return s
      ;[items[idx], items[j]] = [items[j], items[idx]]
      return { ...s, items }
    })
  const remove = (idx: number) => patch((s) => ({ ...s, items: s.items.filter((_, i) => i !== idx) }))
  const add = (e: Exercise) =>
    patch((s) => ({ ...s, items: [...s.items, { exerciseId: e.id, value: e.defaultValue, sets: e.defaultSets }] }))

  const steps = buildSteps(session, (i) => EXERCISE_MAP.get(i))
  const countOf = (exId: string) => session.items.filter((i) => i.exerciseId === exId).length

  if (picking) {
    return (
      <div>
        <div className="head-row">
          <h1>{t('editor.addExercises')}</h1>
          <button className="btn primary" onClick={() => setPicking(false)}>{t('common.done')}</button>
        </div>
        <ExerciseBrowser onAdd={add} addedCount={countOf} />
      </div>
    )
  }

  return (
    <div className="editor">
      <button className="link" onClick={() => go('/')}>{t('common.backToSessions')}</button>
      <input className="name-input" value={sessionLabel(session.id, session.name)} maxLength={80} aria-label={t('editor.sessionName')}
        onChange={(e) => patch((s) => ({ ...s, name: e.target.value }))} />
      {youllNeed(session) && <p className="gear-note">{youllNeed(session)}</p>}

      <div className="card rest-settings">
        <div>
          <span className="meta">{t('editor.restSets')}</span>
          <Stepper label={t('editor.restSetsAria')} value={session.defaultSetRestSec} min={0} max={300} step={5} suffix="s"
            onChange={(v) => patch((s) => ({ ...s, defaultSetRestSec: v }))} />
        </div>
        <div>
          <span className="meta">{t('editor.restExercises')}</span>
          <Stepper label={t('editor.restExercisesAria')} value={session.defaultTransitionSec} min={0} max={300} step={5} suffix="s"
            onChange={(v) => patch((s) => ({ ...s, defaultTransitionSec: v }))} />
        </div>
      </div>

      {session.items.length === 0 && <p className="empty">{t('editor.noExercises')}</p>}
      <ol className="items">
        {session.items.map((item, idx) => {
          const raw = EXERCISE_MAP.get(item.exerciseId)
          if (!raw) return null
          const ex = lx(raw)
          return (
            <li key={idx} className="card item">
              <div className="item-head">
                <Figure frames={ex.animation} props={ex.props} gear={ex.gear} label={t('sessions.illustration', { name: ex.name })} className="thumb" />
                <div className="ex-text">
                  <strong>{ex.name}</strong>
                  <span className="meta">{describe(ex.mode, item.value, item.sets, ex.perSide)}</span>
                </div>
                <div className="reorder">
                  <button className="btn small up" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label={t('editor.moveUp', { name: ex.name })}><Icon name="chev" size={16} /></button>
                  <button className="btn small down" onClick={() => move(idx, 1)} disabled={idx === session.items.length - 1} aria-label={t('editor.moveDown', { name: ex.name })}><Icon name="chev" size={16} /></button>
                </div>
              </div>
              <div className="item-controls">
                <div>
                  <span className="meta">{ex.mode === 'time' ? t('editor.seconds') : t('editor.reps')}</span>
                  <Stepper label={`${ex.name} ${ex.mode === 'time' ? t('editor.secondsAria') : t('editor.repsAria')}`} value={item.value} min={1} max={ex.mode === 'time' ? 600 : 100}
                    step={ex.mode === 'time' ? 5 : 1} onChange={(v) => setItem(idx, { value: v })} />
                </div>
                <div>
                  <span className="meta">{t('editor.sets')}</span>
                  <Stepper label={`${ex.name} ${t('editor.setsAria')}`} value={item.sets} min={1} max={10} step={1} onChange={(v) => setItem(idx, { sets: v })} />
                </div>
                <div>
                  <span className="meta">{t('editor.restAfter')}</span>
                  <Stepper label={`${ex.name} ${t('editor.restAfterAria')}`} value={item.restAfterSec ?? session.defaultTransitionSec} min={0} max={300} step={5} suffix="s"
                    onChange={(v) => setItem(idx, { restAfterSec: v })} />
                  {item.restAfterSec !== undefined && (
                    <button className="link tiny" onClick={() => setItem(idx, { restAfterSec: undefined })}>{t('common.reset')}</button>
                  )}
                </div>
              </div>
              <button className="link danger tiny" onClick={() => remove(idx)}>{t('common.remove')}</button>
            </li>
          )
        })}
      </ol>

      <button className="btn wide" onClick={() => setPicking(true)}>{t('editor.addButton')}</button>

      <div className="bar">
        <span className="meta">{t('dur.approx', { duration: formatDuration(estimateSeconds(steps)) })}</span>
        <button className="btn primary" disabled={steps.length === 0} onClick={() => go(`/play/${id}`)}><Icon name="play" size={16} />{t('editor.start')}</button>
      </div>
    </div>
  )
}
