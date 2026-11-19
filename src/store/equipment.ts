import { useSyncExternalStore } from 'react'
import { EXERCISE_MAP, withGear } from '../data/exercises'
import { t } from '../i18n'
import { EQUIPMENT, type Equipment, type Exercise, type Session } from '../data/types'

const KEY = 'rw.equipment.v1'

function read(): Equipment[] {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(data) ? EQUIPMENT.filter((e) => data.includes(e)) : []
  } catch {
    return []
  }
}

let owned: Equipment[] = read()
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useOwnedEquipment = () => useSyncExternalStore(subscribe, () => owned)

export function toggleEquipment(e: Equipment) {
  owned = owned.includes(e) ? owned.filter((x) => x !== e) : EQUIPMENT.filter((x) => x === e || owned.includes(x))
  try {
    localStorage.setItem(KEY, JSON.stringify(owned))
  } catch {
    /* storage unavailable: keep in-memory state */
  }
  listeners.forEach((l) => l())
}

/** True when the user has everything the exercise needs (bodyweight exercises always pass). */
export const canDo = (e: Exercise, have: readonly Equipment[]) => (e.equipment ?? []).every((x) => have.includes(x))

/** Equipment a session needs, in a stable order. Unknown exercises are ignored. */
export const sessionEquipment = (s: Session): Equipment[] =>
  EQUIPMENT.filter((q) => s.items.some((i) => { const e = EXERCISE_MAP.get(i.exerciseId); return e && withGear(e, i.gear).equipment?.includes(q) }))

/** "You'll need: Dumbbells, Resistance band", or null when the session is bodyweight only. */
export const youllNeed = (s: Session): string | null => {
  const need = sessionEquipment(s)
  return need.length ? t('equipment.youllNeed', { list: need.map((q) => t(`equipment.${q}`)).join(', ') }) : null
}
