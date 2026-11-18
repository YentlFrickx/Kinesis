import { EXERCISE_MAP } from '../data/exercises'
import type { Exercise } from '../data/types'
import { useLocalize, useT } from '../i18n'

/** Collapsible coaching panel: cues, common mistakes and easier/harder variations. Renders nothing without content. */
export function Tips({ exercise }: { exercise: Exercise }) {
  const t = useT()
  const lx = useLocalize()
  const { cues = [], commonMistakes = [], easier, harder } = exercise
  const name = (id?: string) => (id && EXERCISE_MAP.has(id) ? lx(EXERCISE_MAP.get(id)!).name : undefined)
  const easierName = name(easier)
  const harderName = name(harder)
  if (!cues.length && !commonMistakes.length && !easierName && !harderName) return null
  return (
    <details className="tips">
      <summary>{t('tips.title')}</summary>
      {cues.length > 0 && <><h4>{t('tips.cues')}</h4><ul>{cues.map((c) => <li key={c}>{c}</li>)}</ul></>}
      {commonMistakes.length > 0 && <><h4>{t('tips.mistakes')}</h4><ul>{commonMistakes.map((c) => <li key={c}>{c}</li>)}</ul></>}
      {(easierName || harderName) && (
        <p className="tips-var">
          {easierName && <span>{t('tips.easier', { name: easierName })}</span>}
          {harderName && <span>{t('tips.harder', { name: harderName })}</span>}
        </p>
      )}
    </details>
  )
}
