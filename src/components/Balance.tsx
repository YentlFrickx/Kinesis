import { useState } from 'react'
import { useT } from '../i18n'
import { CATEGORIES } from '../data/types'
import { missingCategories, weeklyBalance } from '../lib/progress'
import { useHistory } from '../store/history'

export function Balance() {
  const t = useT()
  const [now] = useState(Date.now)
  const balance = weeklyBalance(useHistory(), now)
  const max = Math.max(1, ...CATEGORIES.map((c) => balance[c]))
  const missing = missingCategories(balance)
  return (
    <>
      <h2 className="meta">{t('balance.title')}</h2>
      <div className="card balance">
        {CATEGORIES.map((c) => (
          <div key={c} className="balance-row">
            <span>{t(`category.${c}`)}</span>
            <div className="balance-track" aria-hidden="true"><div className="balance-fill" style={{ width: `${(balance[c] / max) * 100}%` }} /></div>
            <span className="meta">{balance[c]}</span>
          </div>
        ))}
        <p className="meta balance-note">{missing.length ? t('balance.nudge', { list: missing.map((c) => t(`category.${c}`).toLowerCase()).join(t('gen.or')) }) : t('balance.default')}</p>
      </div>
    </>
  )
}
