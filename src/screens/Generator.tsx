import { useMemo, useState } from 'react'
import { Figure } from '../animation/Figure'
import { EXERCISE_MAP } from '../data/exercises'
import { EQUIPMENT, EQUIPMENT_LABEL, type BodyArea, type Category, type Equipment, type SessionItem } from '../data/types'
import { INTENSITIES, estimateItems, generateSession, neglectedCategories, replacementFor, SET_REST_SEC, TRANSITION_SEC, type Intensity } from '../lib/generator'
import { describe, formatDuration } from '../lib/format'
import { CATEGORIES, CATEGORY_LABEL, weeklyBalance } from '../lib/progress'
import { go } from '../lib/router'
import { toggleEquipment, useOwnedEquipment } from '../store/equipment'
import { useHistory } from '../store/history'
import { createSession, updateSession } from '../store/sessions'

const AREAS: BodyArea[] = ['glutes', 'hips', 'quads', 'hamstrings', 'calves', 'core', 'chest', 'arms', 'shoulders', 'upper back', 'feet', 'full body']
const newSeed = () => Math.floor(Math.random() * 2 ** 31)
const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

export function Generator() {
  const owned = useOwnedEquipment()
  const history = useHistory()
  const [now] = useState(Date.now)
  const neglected = useMemo(() => neglectedCategories(weeklyBalance(history, now)), [history, now])

  const [minutes, setMinutes] = useState(20)
  const [categories, setCategories] = useState<Category[]>(() => (neglected.length ? neglected : ['strength', 'stretch']))
  const [focus, setFocus] = useState<BodyArea[]>([])
  const [intensity, setIntensity] = useState<Intensity>('moderate')
  const [warmCool, setWarmCool] = useState(true)
  const [seed, setSeed] = useState(newSeed)
  const [edited, setEdited] = useState<SessionItem[] | null>(null)

  const opts = { minutes, categories, focus, equipment: owned, intensity, warmCool, seed }
  const result = useMemo(() => generateSession(opts), [minutes, categories, focus, owned, intensity, warmCool, seed])
  const items = edited ?? result.items
  const seconds = edited ? estimateItems(edited) : result.seconds

  const change = <T,>(set: (v: T) => void) => (v: T) => { set(v); setEdited(null) }
  const regenerate = () => { setSeed(newSeed()); setEdited(null) }
  const remove = (idx: number) => setEdited(items.filter((_, i) => i !== idx))
  const swap = (idx: number) => {
    const rep = replacementFor(items, idx, { equipment: owned, focus, intensity, seed: newSeed() })
    if (rep) setEdited(items.map((it, i) => (i === idx ? rep : it)))
  }

  const save = () => {
    const names = focus.length ? focus.join(' + ') : categories.map((c) => CATEGORY_LABEL[c].toLowerCase()).join(' + ')
    const s = createSession(`${minutes} min ${names}`.slice(0, 80))
    updateSession(s.id, (x) => ({ ...x, items: items.map((i) => ({ ...i })), defaultSetRestSec: SET_REST_SEC, defaultTransitionSec: TRANSITION_SEC }))
    go(`/session/${s.id}`)
  }

  return (
    <div className="editor">
      <button className="link" onClick={() => go('/')}>← Sessions</button>
      <h1>Generate session</h1>
      {neglected.length > 0 && (
        <p className="meta">You haven't done {neglected.map((c) => CATEGORY_LABEL[c].toLowerCase()).join(' or ')} this week, so it's pre-selected.</p>
      )}

      <div className="card">
        <span className="meta">Duration</span>
        <div className="stepper" role="group" aria-label="Duration">
          <button className="btn small" disabled={minutes <= 5} aria-label="Decrease duration" onClick={() => change(setMinutes)(minutes - 5)}>−</button>
          <span className="stepper-val">{minutes} min</span>
          <button className="btn small" disabled={minutes >= 90} aria-label="Increase duration" onClick={() => change(setMinutes)(minutes + 5)}>+</button>
        </div>

        <span className="meta">Categories</span>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button key={c} className={`chip${categories.includes(c) ? ' on' : ''}`} aria-pressed={categories.includes(c)}
              onClick={() => { const next = toggle(categories, c); if (next.length) change(setCategories)(next) }}>{CATEGORY_LABEL[c]}</button>
          ))}
        </div>

        <span className="meta">Focus areas (optional)</span>
        <div className="chips">
          {AREAS.map((a) => (
            <button key={a} className={`chip${focus.includes(a) ? ' on' : ''}`} aria-pressed={focus.includes(a)} onClick={() => change(setFocus)(toggle(focus, a))}>{a}</button>
          ))}
        </div>

        <span className="meta">Equipment you have</span>
        <div className="chips">
          {EQUIPMENT.map((q: Equipment) => (
            <button key={q} className={`chip${owned.includes(q) ? ' on' : ''}`} aria-pressed={owned.includes(q)} onClick={() => { toggleEquipment(q); setEdited(null) }}>{EQUIPMENT_LABEL[q]}</button>
          ))}
          <span className="meta">{owned.length === 0 ? 'Bodyweight only' : ''}</span>
        </div>

        <span className="meta">Intensity</span>
        <div className="chips">
          {INTENSITIES.map((i) => (
            <button key={i} className={`chip${intensity === i ? ' on' : ''}`} aria-pressed={intensity === i} onClick={() => change(setIntensity)(i)}>{i}</button>
          ))}
        </div>

        <label className="meta">
          <input type="checkbox" checked={warmCool} onChange={(e) => change(setWarmCool)(e.target.checked)} /> Include warm-up and cool-down
        </label>
      </div>

      <h2 className="meta">Preview · ~{formatDuration(seconds)}</h2>
      {result.notes.map((n) => <p key={n} className="meta" role="status">{n}</p>)}
      {items.length === 0 && <p className="empty">Nothing to show. Try other categories or equipment.</p>}
      <ol className="items">
        {items.map((item, idx) => {
          const ex = EXERCISE_MAP.get(item.exerciseId)
          if (!ex) return null
          return (
            <li key={`${item.exerciseId}-${idx}`} className="card item">
              <div className="item-head">
                <Figure frames={ex.animation} props={ex.props} gear={ex.gear} label={`${ex.name} illustration`} className="thumb" />
                <div className="ex-text">
                  <strong>{ex.name}</strong>
                  <span className="meta">{CATEGORY_LABEL[ex.category]} · {describe(ex.mode, item.value, item.sets, ex.perSide)}</span>
                </div>
              </div>
              <button className="link tiny" onClick={() => swap(idx)}>Swap</button>{' '}
              <button className="link danger tiny" onClick={() => remove(idx)}>Remove</button>
            </li>
          )
        })}
      </ol>

      <div className="bar">
        <button className="btn" onClick={regenerate}>↻ Regenerate</button>
        <button className="btn primary" disabled={items.length === 0} onClick={save}>Save session</button>
      </div>
    </div>
  )
}
