import { useState } from 'react'
import { CATEGORIES, CATEGORY_LABEL, balanceNudge, weeklyBalance } from '../lib/progress'
import { useHistory } from '../store/history'

export function Balance() {
  const [now] = useState(Date.now)
  const balance = weeklyBalance(useHistory(), now)
  const max = Math.max(1, ...CATEGORIES.map((c) => balance[c]))
  const nudge = balanceNudge(balance)
  return (
    <>
      <h2 className="meta">Balance this week</h2>
      <div className="card balance">
        {CATEGORIES.map((c) => (
          <div key={c} className="balance-row">
            <span>{CATEGORY_LABEL[c]}</span>
            <div className="balance-track" aria-hidden="true"><div className="balance-fill" style={{ width: `${(balance[c] / max) * 100}%` }} /></div>
            <span className="meta">{balance[c]}</span>
          </div>
        ))}
        <p className="meta balance-note">{nudge ?? 'Exercises done per category.'}</p>
      </div>
    </>
  )
}
