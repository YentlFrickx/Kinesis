import { useMemo, useState } from 'react'
import { Figure } from '../animation/Figure'
import { EXERCISES } from '../data/exercises'
import { EQUIPMENT, type Category, type Exercise } from '../data/types'
import { useLocalize, useT } from '../i18n'
import { describe } from '../lib/format'
import { canDo, toggleEquipment, useOwnedEquipment } from '../store/equipment'

const CATEGORIES: ('all' | Category)[] = ['all', 'strength', 'stretch', 'mobility']

interface Props {
  /** When set, each card gets an "Add" button (picker mode). */
  onAdd?: (e: Exercise) => void
  addedCount?: (id: string) => number
}

export function ExerciseBrowser({ onAdd, addedCount }: Props) {
  const t = useT()
  const lx = useLocalize()
  const [cat, setCat] = useState<'all' | Category>('all')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const have = useOwnedEquipment()

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return EXERCISES.map(lx).filter(
      (e) =>
        (cat === 'all' || e.category === cat) &&
        (showAll || canDo(e, have)) &&
        (!q || e.name.toLowerCase().includes(q) || e.bodyAreas.some((a) => a.includes(q) || t(`area.${a}`).toLowerCase().includes(q))),
    )
  }, [cat, query, have, showAll, lx, t])
  const hidden = useMemo(() => EXERCISES.filter((e) => !canDo(e, have)).length, [have])

  return (
    <div>
      <input className="search" type="search" placeholder={t('browser.search')} value={query}
        onChange={(e) => setQuery(e.target.value)} aria-label={t('browser.searchAria')} />
      <div className="chips" role="group" aria-label={t('browser.categoryAria')}>
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{t(`category.${c}`)}</button>
        ))}
      </div>
      <div className="chips" role="group" aria-label={t('browser.equipmentAria')}>
        <span className="meta">{t('browser.myEquipment')}</span>
        {EQUIPMENT.map((q) => (
          <button key={q} className={`chip ${have.includes(q) ? 'on' : ''}`} aria-pressed={have.includes(q)}
            onClick={() => toggleEquipment(q)}>{t(`equipment.${q}`)}</button>
        ))}
      </div>
      {hidden > 0 && (
        <p className="gear-note">
          {showAll ? t('browser.showingAll') : t('browser.hidden', { count: hidden })}{' '}
          <button className="link" onClick={() => setShowAll(!showAll)}>{showAll ? t('browser.hide') : t('browser.showAll')}</button>
        </p>
      )}
      {list.length === 0 && <p className="empty">{t('browser.noMatch')}</p>}
      <ul className="ex-list">
        {list.map((e) => {
          const isOpen = open === e.id
          const n = addedCount?.(e.id) ?? 0
          return (
            <li key={e.id} className="ex-card">
              <div className="ex-row">
                <button className="ex-main" onClick={() => setOpen(isOpen ? null : e.id)} aria-expanded={isOpen}>
                  <Figure frames={e.animation} props={e.props} gear={e.gear} label={t('sessions.illustration', { name: e.name })} className="thumb" />
                  <span className="ex-text">
                    <strong>{e.name}</strong>
                    <span className="meta">{describe(e.mode, e.defaultValue, e.defaultSets, e.perSide)} · {t(`category.${e.category}`)}{e.equipment ? ` · ${e.equipment.map((q) => t(`equipment.${q}`)).join(', ')}` : ''}</span>
                  </span>
                </button>
                {onAdd && (
                  <button className="btn small primary" onClick={() => onAdd(e)} aria-label={t('browser.add', { name: e.name })}>
                    {n > 0 ? t('browser.addCount', { n }) : t('common.add')}
                  </button>
                )}
              </div>
              {isOpen && (
                <div className="ex-detail">
                  <Figure frames={e.animation} props={e.props} gear={e.gear} label={t('sessions.animation', { name: e.name })} />
                  <p className="tags">{e.bodyAreas.map((a) => t(`area.${a}`)).join(' · ')}</p>
                  <ol>{e.instructions.map((s) => <li key={s}>{s}</li>)}</ol>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
