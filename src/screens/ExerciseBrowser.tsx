import { useMemo, useState } from 'react'
import { Figure } from '../animation/Figure'
import { EXERCISES, canDo } from '../data/exercises'
import { BODY_AREAS, CATEGORIES, EQUIPMENT, type Exercise } from '../data/types'
import { useLocalize, useT } from '../i18n'
import { Icon } from '../components/Icon'
import { Tips } from '../components/Tips'
import { describe } from '../lib/format'
import { DEFAULT_FILTERS, activeFilterCount, filterExercises, recentExerciseIds, type ExerciseFilters, type SortKey } from '../lib/exerciseFilter'
import { toggleEquipment, useOwnedEquipment } from '../store/equipment'
import { toggleFavorite, useFavorites } from '../store/favorites'
import { useHistory } from '../store/history'

const SORTS: SortKey[] = ['az', 'category', 'area']

/** Filters outlive the component so they persist while the editor's picker is closed and reopened. */
let savedFilters: ExerciseFilters = DEFAULT_FILTERS

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

interface Props {
  /** When set, each card gets an "Add" button (picker mode). */
  onAdd?: (e: Exercise) => void
  addedCount?: (id: string) => number
  /** Ids already in the session being edited (enables the "not yet in this session" filter). */
  inSession?: ReadonlySet<string>
}

export function ExerciseBrowser({ onAdd, addedCount, inSession }: Props) {
  const t = useT()
  const lx = useLocalize()
  const [filters, setFiltersState] = useState(savedFilters)
  const setFilters = (patch: Partial<ExerciseFilters>) => {
    savedFilters = { ...savedFilters, ...patch }
    setFiltersState(savedFilters)
  }
  const [open, setOpen] = useState<string | null>(null)
  const have = useOwnedEquipment()
  const favorites = useFavorites()
  const history = useHistory()
  const showAll = !filters.onlyMyEquipment
  const picker = inSession !== undefined || onAdd !== undefined
  // The filters are shared with the editor's picker; "not yet in this session" only means something there, so the
  // Library tab ignores it (it showed up as an active filter chip there, with no visible toggle to explain it).
  const f = useMemo(() => (picker || !filters.notInSession ? filters : { ...filters, notInSession: false }), [picker, filters])
  const favSet = useMemo(() => new Set(favorites), [favorites])

  const list = useMemo(
    () => filterExercises(EXERCISES.map(lx), f, {
      favorites: favSet, recent: recentExerciseIds(history), inSession: inSession ?? new Set(), have,
      areaLabel: (a) => t(`area.${a}`),
    }),
    [lx, f, favSet, history, inSession, have, t],
  )
  const hidden = useMemo(() => EXERCISES.filter((e) => !canDo(e, have)).length, [have])
  const reset = () => setFilters({ ...DEFAULT_FILTERS, sort: f.sort, onlyMyEquipment: f.onlyMyEquipment })

  const needLabel = (x: 'none' | (typeof EQUIPMENT)[number]) => (x === 'none' ? t('browser.needsNone') : t(`equipment.${x}`))
  const active: { key: string; label: string; clear: () => void }[] = [
    ...(f.query.trim() ? [{ key: 'q', label: `“${f.query.trim()}”`, clear: () => setFilters({ query: '' }) }] : []),
    ...f.categories.map((c) => ({ key: `c-${c}`, label: t(`category.${c}`), clear: () => setFilters({ categories: toggle(f.categories, c) }) })),
    ...f.areas.map((a) => ({ key: `a-${a}`, label: t(`area.${a}`), clear: () => setFilters({ areas: toggle(f.areas, a) }) })),
    ...f.equipment.map((x) => ({ key: `e-${x}`, label: needLabel(x), clear: () => setFilters({ equipment: toggle(f.equipment, x) }) })),
    ...(f.perSide !== 'any' ? [{ key: 'side', label: t(`browser.side.${f.perSide}`), clear: () => setFilters({ perSide: 'any' }) }] : []),
    ...(f.mode !== 'any' ? [{ key: 'mode', label: t(`browser.mode.${f.mode}`), clear: () => setFilters({ mode: 'any' }) }] : []),
    ...(f.favoritesOnly ? [{ key: 'fav', label: t('browser.favorites'), clear: () => setFilters({ favoritesOnly: false }) }] : []),
    ...(f.recentOnly ? [{ key: 'rec', label: t('browser.recent'), clear: () => setFilters({ recentOnly: false }) }] : []),
    ...(f.notInSession ? [{ key: 'nis', label: t('browser.notInSession'), clear: () => setFilters({ notInSession: false }) }] : []),
  ]

  return (
    <div>
      <input className="search" type="search" placeholder={t('browser.search')} value={f.query}
        onChange={(e) => setFilters({ query: e.target.value })} aria-label={t('browser.searchAria')} />
      <div className="chips" role="group" aria-label={t('browser.categoryAria')}>
        <button className={`chip ${f.categories.length === 0 ? 'on' : ''}`} aria-pressed={f.categories.length === 0}
          onClick={() => setFilters({ categories: [] })}>{t('category.all')}</button>
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip ${f.categories.includes(c) ? 'on' : ''}`} aria-pressed={f.categories.includes(c)}
            onClick={() => setFilters({ categories: toggle(f.categories, c) })}>{t(`category.${c}`)}</button>
        ))}
      </div>
      <div className="chips" role="group" aria-label={t('browser.quickAria')}>
        <button className={`chip ${f.favoritesOnly ? 'on' : ''}`} aria-pressed={f.favoritesOnly}
          onClick={() => setFilters({ favoritesOnly: !f.favoritesOnly })}>{t('browser.favorites')}</button>
        <button className={`chip ${f.recentOnly ? 'on' : ''}`} aria-pressed={f.recentOnly}
          onClick={() => setFilters({ recentOnly: !f.recentOnly })}>{t('browser.recent')}</button>
        {picker && (
          <button className={`chip ${f.notInSession ? 'on' : ''}`} aria-pressed={f.notInSession}
            onClick={() => setFilters({ notInSession: !f.notInSession })}>{t('browser.notInSession')}</button>
        )}
      </div>
      <div className="chips" role="group" aria-label={t('browser.equipmentAria')}>
        <span className="meta">{t('browser.myEquipment')}</span>
        {EQUIPMENT.map((q) => (
          <button key={q} className={`chip ${have.includes(q) ? 'on' : ''}`} aria-pressed={have.includes(q)}
            onClick={() => toggleEquipment(q)}>{t(`equipment.${q}`)}</button>
        ))}
      </div>
      <details className="more-filters">
        <summary>{t('browser.filters')}</summary>
        <div className="chips" role="group" aria-label={t('browser.areaAria')}>
          {BODY_AREAS.map((a) => (
            <button key={a} className={`chip ${f.areas.includes(a) ? 'on' : ''}`} aria-pressed={f.areas.includes(a)}
              onClick={() => setFilters({ areas: toggle(f.areas, a) })}>{t(`area.${a}`)}</button>
          ))}
        </div>
        <div className="chips" role="group" aria-label={t('browser.needsAria')}>
          {(['none', ...EQUIPMENT] as const).map((x) => (
            <button key={x} className={`chip ${f.equipment.includes(x) ? 'on' : ''}`} aria-pressed={f.equipment.includes(x)}
              onClick={() => setFilters({ equipment: toggle(f.equipment, x) })}>{needLabel(x)}</button>
          ))}
        </div>
        <div className="chips">
          <label className="meta">{t('browser.sideAria')}{' '}
            <select value={f.perSide} onChange={(e) => setFilters({ perSide: e.target.value as ExerciseFilters['perSide'] })}>
              {(['any', 'yes', 'no'] as const).map((v) => <option key={v} value={v}>{t(`browser.side.${v}`)}</option>)}
            </select>
          </label>
          <label className="meta">{t('browser.modeAria')}{' '}
            <select value={f.mode} onChange={(e) => setFilters({ mode: e.target.value as ExerciseFilters['mode'] })}>
              {(['any', 'time', 'reps'] as const).map((v) => <option key={v} value={v}>{t(`browser.mode.${v}`)}</option>)}
            </select>
          </label>
          <label className="meta">{t('browser.sortAria')}{' '}
            <select value={f.sort} onChange={(e) => setFilters({ sort: e.target.value as SortKey })}>
              {SORTS.map((v) => <option key={v} value={v}>{t(`browser.sort.${v}`)}</option>)}
            </select>
          </label>
        </div>
      </details>
      {active.length > 0 && (
        <div className="chips" role="group" aria-label={t('browser.activeAria')}>
          {active.map((a) => (
            <button key={a.key} className="chip on" onClick={a.clear} aria-label={t('browser.remove', { label: a.label })}>
              {a.label} <Icon name="x" size={14} />
            </button>
          ))}
          <button className="link" onClick={reset}>{t('browser.clear')}</button>
        </div>
      )}
      <p className="meta" aria-live="polite">{t('browser.count', { count: list.length })}</p>
      {hidden > 0 && (
        <p className="gear-note">
          {showAll ? t('browser.showingAll') : t('browser.hidden', { count: hidden })}{' '}
          <button className="link" onClick={() => setFilters({ onlyMyEquipment: showAll })}>{showAll ? t('browser.hide') : t('browser.showAll')}</button>
        </p>
      )}
      {list.length === 0 && (
        <p className="empty">
          {f.favoritesOnly && favorites.length === 0 ? t('browser.noFavorites') : t('browser.noMatch')}{' '}
          {activeFilterCount(f) > 0 && <button className="link" onClick={reset}>{t('browser.clear')}</button>}
        </p>
      )}
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
                <button className="btn small" aria-pressed={favSet.has(e.id)} onClick={() => toggleFavorite(e.id)}
                  aria-label={t(favSet.has(e.id) ? 'browser.unfavorite' : 'browser.favorite', { name: e.name })}>
                  <Icon name="star" size={16} />
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
                  <Tips exercise={e} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
