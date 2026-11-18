import { useState } from 'react'
import { Figure } from '../animation/Figure'
import { EXERCISE_MAP } from '../data/exercises'
import type { Exercise, Session, SessionItem } from '../data/types'
import { describe, formatDuration } from '../lib/format'
import { go } from '../lib/router'
import { buildSteps, estimateSeconds } from '../player/engine'
import { getSession, updateSession, useSessions } from '../store/sessions'
import { ExerciseBrowser } from './ExerciseBrowser'

function Stepper({ label, value, min, max, step, suffix, onChange }: {
  label: string; value: number; min: number; max: number; step: number; suffix?: string
  onChange: (v: number) => void
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, v)))
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button className="btn small" onClick={() => set(value - step)} disabled={value <= min} aria-label={`Decrease ${label}`}>−</button>
      <span className="stepper-val">{value}{suffix}</span>
      <button className="btn small" onClick={() => set(value + step)} disabled={value >= max} aria-label={`Increase ${label}`}>+</button>
    </div>
  )
}

export function Editor({ id }: { id: string }) {
  useSessions() // re-render on changes
  const session = getSession(id)
  const [picking, setPicking] = useState(false)

  if (!session) {
    return (
      <div>
        <p className="empty">Session not found.</p>
        <button className="btn" onClick={() => go('/')}>Back</button>
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
          <h1>Add exercises</h1>
          <button className="btn primary" onClick={() => setPicking(false)}>Done</button>
        </div>
        <ExerciseBrowser onAdd={add} addedCount={countOf} />
      </div>
    )
  }

  return (
    <div>
      <button className="link" onClick={() => go('/')}>← Sessions</button>
      <input className="name-input" value={session.name} maxLength={80} aria-label="Session name"
        onChange={(e) => patch((s) => ({ ...s, name: e.target.value }))} />

      <div className="card rest-settings">
        <div>
          <span className="meta">Rest between sets</span>
          <Stepper label="rest between sets" value={session.defaultSetRestSec} min={0} max={300} step={5} suffix="s"
            onChange={(v) => patch((s) => ({ ...s, defaultSetRestSec: v }))} />
        </div>
        <div>
          <span className="meta">Rest between exercises</span>
          <Stepper label="rest between exercises" value={session.defaultTransitionSec} min={0} max={300} step={5} suffix="s"
            onChange={(v) => patch((s) => ({ ...s, defaultTransitionSec: v }))} />
        </div>
      </div>

      {session.items.length === 0 && <p className="empty">No exercises yet.</p>}
      <ol className="items">
        {session.items.map((item, idx) => {
          const ex = EXERCISE_MAP.get(item.exerciseId)
          if (!ex) return null
          return (
            <li key={idx} className="card item">
              <div className="item-head">
                <Figure frames={ex.animation} props={ex.props} gear={ex.gear} label={`${ex.name} illustration`} className="thumb" />
                <div className="ex-text">
                  <strong>{ex.name}</strong>
                  <span className="meta">{describe(ex.mode, item.value, item.sets, ex.perSide)}</span>
                </div>
                <div className="reorder">
                  <button className="btn small" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label={`Move ${ex.name} up`}>↑</button>
                  <button className="btn small" onClick={() => move(idx, 1)} disabled={idx === session.items.length - 1} aria-label={`Move ${ex.name} down`}>↓</button>
                </div>
              </div>
              <div className="item-controls">
                <div>
                  <span className="meta">{ex.mode === 'time' ? 'Seconds' : 'Reps'}</span>
                  <Stepper label={`${ex.name} ${ex.mode === 'time' ? 'seconds' : 'reps'}`} value={item.value} min={1} max={ex.mode === 'time' ? 600 : 100}
                    step={ex.mode === 'time' ? 5 : 1} onChange={(v) => setItem(idx, { value: v })} />
                </div>
                <div>
                  <span className="meta">Sets</span>
                  <Stepper label={`${ex.name} sets`} value={item.sets} min={1} max={10} step={1} onChange={(v) => setItem(idx, { sets: v })} />
                </div>
                <div>
                  <span className="meta">Rest after</span>
                  <Stepper label={`${ex.name} rest after`} value={item.restAfterSec ?? session.defaultTransitionSec} min={0} max={300} step={5} suffix="s"
                    onChange={(v) => setItem(idx, { restAfterSec: v })} />
                  {item.restAfterSec !== undefined && (
                    <button className="link tiny" onClick={() => setItem(idx, { restAfterSec: undefined })}>reset</button>
                  )}
                </div>
              </div>
              <button className="link danger tiny" onClick={() => remove(idx)}>Remove</button>
            </li>
          )
        })}
      </ol>

      <button className="btn wide" onClick={() => setPicking(true)}>+ Add exercises</button>

      <div className="bar">
        <span className="meta">~{formatDuration(estimateSeconds(steps))}</span>
        <button className="btn primary" disabled={steps.length === 0} onClick={() => go(`/play/${id}`)}>▶ Start</button>
      </div>
    </div>
  )
}
