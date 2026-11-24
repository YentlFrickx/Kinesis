import { useMemo, useState } from 'react'
import { Figure } from '../animation/Figure'
import { Icon } from '../components/Icon'
import { EXERCISE_MAP } from '../data/exercises'
import { BODY_AREAS, CATEGORIES, EQUIPMENT, MAX_NAME_LENGTH, type BodyArea, type Category, type SessionItem } from '../data/types'
import { INTENSITIES, estimateItems, generateSession, replacementFor, SET_REST_SEC, TRANSITION_SEC, type Intensity } from '../lib/generator'
import { describe, formatDuration } from '../lib/format'
import { missingCategories, weeklyBalance } from '../lib/progress'
import { useToday } from '../lib/today'
import { useLocalize, useT } from '../i18n'
import { go } from '../lib/router'
import { toggleEquipment, useOwnedEquipment } from '../store/equipment'
import { useHistory } from '../store/history'
import { createSession, updateSession } from '../store/sessions'
import { showToast } from '../store/toast'

const newSeed = () => Math.floor(Math.random() * 2 ** 31)
const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

export function Generator() {
  const t = useT()
  const lx = useLocalize()
  const owned = useOwnedEquipment()
  const history = useHistory()
  const now = useToday()
  const neglected = useMemo(() => missingCategories(weeklyBalance(history, now)), [history, now])

  const [minutes, setMinutes] = useState(20)
  const [categories, setCategories] = useState<Category[]>(() => (neglected.length ? neglected : ['strength', 'stretch']))
  const [focus, setFocus] = useState<BodyArea[]>([])
  const [intensity, setIntensity] = useState<Intensity>('moderate')
  const [warmCool, setWarmCool] = useState(true)
  const [seed, setSeed] = useState(newSeed)
  const [edited, setEdited] = useState<SessionItem[] | null>(null)

  const result = useMemo(
    () => generateSession({ minutes, categories, focus, equipment: owned, intensity, warmCool, seed }),
    [minutes, categories, focus, owned, intensity, warmCool, seed],
  )
  const items = edited ?? result.items
  const seconds = edited ? estimateItems(edited) : result.seconds

  const change = <T,>(set: (v: T) => void) => (v: T) => { set(v); setEdited(null) }
  const regenerate = () => { setSeed(newSeed()); setEdited(null) }
  const remove = (idx: number) => setEdited(items.filter((_, i) => i !== idx))
  const swap = (idx: number) => {
    const rep = replacementFor(items, idx, { equipment: owned, focus, intensity, seed: newSeed() })
    if (rep) setEdited(items.map((it, i) => (i === idx ? rep : it)))
    else {
      const category = EXERCISE_MAP.get(items[idx].exerciseId)?.category
      if (category) showToast(t('gen.noSwap', { category: t(`category.${category}`).toLowerCase() }))
    }
  }

  const save = () => {
    const names = (focus.length ? focus.map((a) => t(`area.${a}`)) : categories.map((c) => t(`category.${c}`).toLowerCase())).join(' + ')
    const s = createSession(t('gen.sessionName', { minutes, names }).slice(0, MAX_NAME_LENGTH))
    updateSession(s.id, (x) => ({ ...x, items: items.map((i) => ({ ...i })), defaultSetRestSec: SET_REST_SEC, defaultTransitionSec: TRANSITION_SEC }))
    go(`/session/${s.id}`)
  }

  return (
    <div className="editor">
      <button className="link" onClick={() => go('/')}>{t('common.backToSessions')}</button>
      <h1>{t('gen.title')}</h1>
      {neglected.length > 0 && (
        <p className="meta">{t('gen.neglected', { list: neglected.map((c) => t(`category.${c}`).toLowerCase()).join(t('gen.or')) })}</p>
      )}

      <div className="card">
        <span className="meta">{t('gen.duration')}</span>
        <div className="stepper" role="group" aria-label={t('gen.durationAria')}>
          <button className="btn small" disabled={minutes <= 5} aria-label={t('gen.decreaseDuration')} onClick={() => change(setMinutes)(minutes - 5)}><Icon name="minus" size={16} /></button>
          <span className="stepper-val">{t('unit.minutes', { n: minutes })}</span>
          <button className="btn small" disabled={minutes >= 90} aria-label={t('gen.increaseDuration')} onClick={() => change(setMinutes)(minutes + 5)}><Icon name="plus" size={16} /></button>
        </div>

        <span className="meta">{t('gen.categories')}</span>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button key={c} className={`chip${categories.includes(c) ? ' on' : ''}`} aria-pressed={categories.includes(c)}
              onClick={() => { const next = toggle(categories, c); if (next.length) change(setCategories)(next) }}>{t(`category.${c}`)}</button>
          ))}
        </div>

        <span className="meta">{t('gen.focus')}</span>
        <div className="chips">
          {BODY_AREAS.map((a) => (
            <button key={a} className={`chip${focus.includes(a) ? ' on' : ''}`} aria-pressed={focus.includes(a)} onClick={() => change(setFocus)(toggle(focus, a))}>{t(`area.${a}`)}</button>
          ))}
        </div>

        <span className="meta">{t('gen.equipment')}</span>
        <div className="chips">
          {EQUIPMENT.map((q) => (
            <button key={q} className={`chip${owned.includes(q) ? ' on' : ''}`} aria-pressed={owned.includes(q)} onClick={() => { toggleEquipment(q); setEdited(null) }}>{t(`equipment.${q}`)}</button>
          ))}
          <span className="meta">{owned.length === 0 ? t('gen.bodyweightOnly') : ''}</span>
        </div>

        <span className="meta">{t('gen.intensity')}</span>
        <div className="chips">
          {INTENSITIES.map((i) => (
            <button key={i} className={`chip${intensity === i ? ' on' : ''}`} aria-pressed={intensity === i} onClick={() => change(setIntensity)(i)}>{t(`intensity.${i}`)}</button>
          ))}
        </div>

        <label className="meta">
          <input type="checkbox" checked={warmCool} onChange={(e) => change(setWarmCool)(e.target.checked)} /> {t('gen.warmCool')}
        </label>
      </div>

      <h2 className="meta">{t('gen.preview', { duration: formatDuration(seconds) })}</h2>
      {result.notes.map((n, i) => <p key={`${n.key}-${i}`} className="meta" role="status">{t(n.key, n.params && 'category' in n.params ? { category: t(`category.${n.params.category as Category}`).toLowerCase() } : n.params)}</p>)}
      {items.length === 0 && <p className="empty">{t('gen.nothing')}</p>}
      <ol className="items">
        {items.map((item, idx) => {
          const raw = EXERCISE_MAP.get(item.exerciseId)
          if (!raw) return null
          const ex = lx(raw)
          return (
            <li key={`${item.exerciseId}-${idx}`} className="card item">
              <div className="item-head">
                <Figure frames={ex.animation} props={ex.props} gear={ex.gear} label={t('sessions.illustration', { name: ex.name })} className="thumb" />
                <div className="ex-text">
                  <strong>{ex.name}</strong>
                  <span className="meta">{t(`category.${ex.category}`)} · {describe(ex.mode, item.value, item.sets, ex.perSide)}</span>
                </div>
              </div>
              <button className="link tiny" onClick={() => swap(idx)}>{t('gen.swap')}</button>{' '}
              <button className="link danger tiny" onClick={() => remove(idx)}>{t('common.remove')}</button>
            </li>
          )
        })}
      </ol>

      <div className="bar">
        <button className="btn" onClick={regenerate}><Icon name="refresh" size={16} />{t('gen.regenerate')}</button>
        <button className="btn primary" disabled={items.length === 0} onClick={save}>{t('gen.save')}</button>
      </div>
    </div>
  )
}
