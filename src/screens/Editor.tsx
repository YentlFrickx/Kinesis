import { startSession } from '../store/run'
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Figure } from '../animation/Figure'
import { Icon } from '../components/Icon'
import { Tips } from '../components/Tips'
import { sessionLabel, useLocalize, useT } from '../i18n'
import { EXERCISE_MAP, withGear } from '../data/exercises'
import { EQUIPMENT, MAX_NOTE_LENGTH, type Exercise, type Session, type SessionItem } from '../data/types'
import { describe, formatDuration } from '../lib/format'
import { go } from '../lib/router'
import { buildSteps, estimateSeconds } from '../player/engine'
import { youllNeed } from '../store/equipment'
import { getSession, updateSession, useSessions } from '../store/sessions'
import { showToast } from '../store/toast'
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
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const [dragging, setDragging] = useState<number | null>(null)
  const listRef = useRef<HTMLOListElement>(null)

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
  /** Moves the item at `from` to position `to`. */
  const moveTo = (from: number, to: number) =>
    patch((s) => {
      if (from === to || to < 0 || to >= s.items.length) return s
      const items = [...s.items]
      items.splice(to, 0, items.splice(from, 1)[0])
      return { ...s, items }
    })
  const remove = (idx: number, name: string) => {
    const before = session.items
    const removed = before[idx]
    patch((s) => ({ ...s, items: s.items.filter((_, i) => i !== idx) }))
    showToast(t('editor.removed', { name }), () =>
      patch((s) => {
        if (s.items.some((i) => i.id === removed.id)) return s
        const items = [...s.items]
        items.splice(Math.min(idx, items.length), 0, removed)
        return { ...s, items }
      }))
  }
  const duplicateItem = (idx: number) =>
    patch((s) => {
      const items = [...s.items]
      items.splice(idx + 1, 0, { ...items[idx], id: crypto.randomUUID() })
      return { ...s, items }
    })

  // Pointer drag (mouse, touch, pen) on the grip: the item follows the pointer by swapping live.
  const onGripDown = (e: PointerEvent<HTMLButtonElement>, idx: number) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(idx)
  }
  const onGripMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (dragging === null || !listRef.current) return
    const rows = Array.from(listRef.current.children) as HTMLElement[]
    const over = rows.findIndex((r) => { const b = r.getBoundingClientRect(); return e.clientY >= b.top && e.clientY <= b.bottom })
    if (over !== -1 && over !== dragging) {
      moveTo(dragging, over)
      setDragging(over)
    }
  }
  const endDrag = () => setDragging(null)
  // Keyboard on the grip: arrows move, Home/End jump; the new position is announced via the toast region.
  const onGripKey = (e: KeyboardEvent<HTMLButtonElement>, idx: number, name: string) => {
    const last = session.items.length - 1
    const to = e.key === 'ArrowUp' ? idx - 1 : e.key === 'ArrowDown' ? idx + 1 : e.key === 'Home' ? 0 : e.key === 'End' ? last : null
    if (to === null) return
    e.preventDefault()
    const clamped = Math.min(last, Math.max(0, to))
    if (clamped === idx) return
    moveTo(idx, clamped)
    showToast(t('editor.moved', { name, pos: clamped + 1, total: last + 1 }))
    requestAnimationFrame(() => listRef.current?.children[clamped]?.querySelector<HTMLElement>('.grip')?.focus())
  }
  const add = (e: Exercise) =>
    patch((s) => ({ ...s, items: [...s.items, { exerciseId: e.id, value: e.defaultValue, sets: e.defaultSets }] }))

  const keyOf = (it: SessionItem, idx: number) => it.id ?? String(idx)
  const toggle = (k: string) =>
    setCollapsed((c) => { const n = new Set(c); if (n.has(k)) n.delete(k); else n.add(k); return n })
  const allCollapsed = session.items.length > 0 && session.items.every((it, i) => collapsed.has(keyOf(it, i)))
  const toggleAll = () => setCollapsed(allCollapsed ? new Set() : new Set(session.items.map(keyOf)))

  const steps = buildSteps(session, (i) => EXERCISE_MAP.get(i))
  const countOf = (exId: string) => session.items.filter((i) => i.exerciseId === exId).length

  if (picking) {
    return (
      <div>
        <div className="head-row">
          <h1>{t('editor.addExercises')}</h1>
          <button className="btn primary" onClick={() => setPicking(false)}>{t('common.done')}</button>
        </div>
        <ExerciseBrowser onAdd={add} addedCount={countOf} inSession={new Set(session.items.map((i) => i.exerciseId))} />
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
      {session.items.length > 1 && (
        <button className="link tiny collapse-all" onClick={toggleAll}>{allCollapsed ? t('editor.expandAll') : t('editor.collapseAll')}</button>
      )}
      <ol className="items" ref={listRef}>
        {session.items.map((item, idx) => {
          const raw = EXERCISE_MAP.get(item.exerciseId)
          if (!raw) return null
          const ex = lx(withGear(raw, item.gear))
          const options = EQUIPMENT.filter((q) => raw.gearOptions?.[q])
          const k = keyOf(item, idx)
          const open = !collapsed.has(k)
          return (
            <li key={item.id ?? idx} className={`card item${dragging === idx ? ' dragging' : ''}${open ? '' : ' collapsed'}`}>
              <div className="item-head">
                <button className="item-toggle" aria-expanded={open} onClick={() => toggle(k)}>
                  <Figure frames={ex.animation} props={ex.props} gear={ex.gear} label={t('sessions.illustration', { name: ex.name })} className="thumb" />
                  <span className="ex-text">
                    <strong>{ex.name}</strong>
                    <span className="meta">{describe(ex.mode, item.value, item.sets, ex.perSide)}</span>
                  </span>
                  <span className="fold" aria-hidden="true"><Icon name="chev" size={18} /></span>
                  <span className="sr-only">{open ? t('editor.collapse') : t('editor.expand')}</span>
                </button>
                <button className="icon-btn grip" aria-label={t('editor.dragHandle', { name: ex.name })}
                  onPointerDown={(e) => onGripDown(e, idx)} onPointerMove={onGripMove} onPointerUp={endDrag} onPointerCancel={endDrag}
                  onKeyDown={(e) => onGripKey(e, idx, ex.name)}><Icon name="grip" size={20} /></button>
              </div>
              {open && <>
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
                {idx < session.items.length - 1 && <div>
                  <span className="meta">{t('editor.restAfter')}</span>
                  <Stepper label={`${ex.name} ${t('editor.restAfterAria')}`} value={item.restAfterSec ?? session.defaultTransitionSec} min={0} max={300} step={5} suffix="s"
                    onChange={(v) => setItem(idx, { restAfterSec: v })} />
                  {item.restAfterSec !== undefined && (
                    <button className="link tiny" onClick={() => setItem(idx, { restAfterSec: undefined })}>{t('common.reset')}</button>
                  )}
                </div>}
              </div>
              {options.length > 0 && (
                <div className="chips gear-pick" role="group" aria-label={`${ex.name} ${t('gear.label')}`}>
                  {[undefined, ...options].map((q) => (
                    <button key={q ?? 'none'} className={`chip${item.gear === q ? ' on' : ''}`} aria-pressed={item.gear === q}
                      onClick={() => setItem(idx, { gear: q })}>{q ? t(`equipment.${q}`) : t('gear.none')}</button>
                  ))}
                </div>
              )}
              <input className="item-note" value={item.note ?? ''} maxLength={MAX_NOTE_LENGTH} placeholder={t('editor.notePlaceholder')} aria-label={`${ex.name} ${t('editor.note')}`}
                onChange={(e) => setItem(idx, { note: e.target.value || undefined })} />
              <Tips exercise={ex} />
              <div className="item-actions">
                <button className="link tiny" onClick={() => duplicateItem(idx)}>{t('editor.duplicateItem')}</button>
                <button className="link danger tiny" onClick={() => remove(idx, ex.name)}>{t('common.remove')}</button>
              </div>
              </>}
            </li>
          )
        })}
      </ol>

      <button className="btn wide" onClick={() => setPicking(true)}>{t('editor.addButton')}</button>

      <div className="bar">
        <span className="meta">{t('dur.approx', { duration: formatDuration(estimateSeconds(steps)) })}</span>
        <button className="btn primary" disabled={steps.length === 0} onClick={() => startSession(id)}><Icon name="play" size={16} />{t('editor.start')}</button>
      </div>
    </div>
  )
}
