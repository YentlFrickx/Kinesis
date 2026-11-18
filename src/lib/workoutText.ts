import type { Exercise, SessionItem } from '../data/types'
import type { Params, TranslationKey } from '../i18n/core'

/** The part of a session item worth keeping with a history entry (the session may be edited or deleted later). */
export type WorkoutItem = Pick<SessionItem, 'exerciseId' | 'value' | 'sets' | 'note'>

export const snapshotItems = (items: SessionItem[]): WorkoutItem[] =>
  items.map(({ exerciseId, value, sets, note }) => ({ exerciseId, value, sets, ...(note ? { note } : {}) }))

/**
 * Plain-text summary for pasting into a Strava "What did you workout?" box, e.g.
 *
 *   Core basics
 *   Plank: 3 sets x 30 sec
 *   Side plank: 2 sets x 20 sec each side
 *   Glute bridge: 3 sets x 12 reps (with a band)
 */
export function workoutText(
  name: string,
  items: WorkoutItem[],
  lookup: (exerciseId: string) => Exercise | undefined,
  t: (key: TranslationKey, params?: Params) => string,
): string {
  const lines = items.flatMap((item) => {
    const ex = lookup(item.exerciseId)
    if (!ex) return []
    const amount = ex.mode === 'time' ? t('share.seconds', { n: item.value }) : t('share.reps', { count: item.value })
    const parts = [
      t('share.sets', { count: item.sets }),
      `x ${amount}${ex.perSide ? ` ${t('share.eachSide')}` : ''}`,
    ]
    return [`${ex.name}: ${parts.join(' ')}${item.note ? ` (${item.note})` : ''}`]
  })
  return [name, ...lines].join('\n')
}
