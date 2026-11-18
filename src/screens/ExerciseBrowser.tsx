import { useMemo, useState } from 'react'
import { Figure } from '../animation/Figure'
import { EXERCISES } from '../data/exercises'
import { EQUIPMENT, EQUIPMENT_LABEL, type Category, type Exercise } from '../data/types'
import { describe } from '../lib/format'
import { canDo, toggleEquipment, useOwnedEquipment } from '../store/equipment'

const CATEGORIES: ('all' | Category)[] = ['all', 'strength', 'stretch', 'mobility']

interface Props {
  /** When set, each card gets an "Add" button (picker mode). */
  onAdd?: (e: Exercise) => void
  addedCount?: (id: string) => number
}

export function ExerciseBrowser({ onAdd, addedCount }: Props) {
  const [cat, setCat] = useState<'all' | Category>('all')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const have = useOwnedEquipment()

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return EXERCISES.filter(
      (e) =>
        (cat === 'all' || e.category === cat) &&
        (showAll || canDo(e, have)) &&
        (!q || e.name.toLowerCase().includes(q) || e.bodyAreas.some((a) => a.includes(q))),
    )
  }, [cat, query, have, showAll])
  const hidden = useMemo(() => EXERCISES.filter((e) => !canDo(e, have)).length, [have])

  return (
    <div>
      <input className="search" type="search" placeholder="Search name or body area…" value={query}
        onChange={(e) => setQuery(e.target.value)} aria-label="Search exercises" />
      <div className="chips" role="group" aria-label="Category">
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <div className="chips" role="group" aria-label="My equipment">
        <span className="meta">My equipment:</span>
        {EQUIPMENT.map((q) => (
          <button key={q} className={`chip ${have.includes(q) ? 'on' : ''}`} aria-pressed={have.includes(q)}
            onClick={() => toggleEquipment(q)}>{EQUIPMENT_LABEL[q]}</button>
        ))}
      </div>
      {hidden > 0 && (
        <p className="gear-note">
          {showAll ? 'Showing exercises that need equipment you have not selected. ' : `${hidden} exercise${hidden === 1 ? '' : 's'} hidden (need equipment you have not selected). `}
          <button className="link" onClick={() => setShowAll(!showAll)}>{showAll ? 'Hide them' : 'Show all'}</button>
        </p>
      )}
      {list.length === 0 && <p className="empty">No exercises match.</p>}
      <ul className="ex-list">
        {list.map((e) => {
          const isOpen = open === e.id
          const n = addedCount?.(e.id) ?? 0
          return (
            <li key={e.id} className="ex-card">
              <div className="ex-row">
                <button className="ex-main" onClick={() => setOpen(isOpen ? null : e.id)} aria-expanded={isOpen}>
                  <Figure frames={e.animation} props={e.props} gear={e.gear} label={`${e.name} illustration`} className="thumb" />
                  <span className="ex-text">
                    <strong>{e.name}</strong>
                    <span className="meta">{describe(e.mode, e.defaultValue, e.defaultSets, e.perSide)} · {e.category}{e.equipment ? ` · ${e.equipment.map((q) => EQUIPMENT_LABEL[q]).join(', ')}` : ''}</span>
                  </span>
                </button>
                {onAdd && (
                  <button className="btn small primary" onClick={() => onAdd(e)} aria-label={`Add ${e.name}`}>
                    {n > 0 ? `Add (${n})` : 'Add'}
                  </button>
                )}
              </div>
              {isOpen && (
                <div className="ex-detail">
                  <Figure frames={e.animation} props={e.props} gear={e.gear} label={`${e.name} animation`} />
                  <p className="tags">{e.bodyAreas.join(' · ')}</p>
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
