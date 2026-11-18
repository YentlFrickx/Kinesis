import { Icon } from '../components/Icon'
import { Sheet } from '../components/Sheet'
import { useState } from 'react'
import { Balance } from '../components/Balance'
import { GoalRing } from '../components/GoalRing'
import { Heatmap } from '../components/Heatmap'
import { formatDuration } from '../lib/format'
import { MILESTONES } from '../lib/progress'
import { clearHistory, deleteEntry, useHistory } from '../store/history'
import { useUnlocked } from '../store/milestones'

const dayKey = (t: number) => new Date(t).toDateString()
const dayLabel = (t: number) => {
  const d = new Date(t)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 86_400_000)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function History() {
  const [confirmClear, setConfirmClear] = useState(false)
  const entries = useHistory()
  const unlocked = useUnlocked()
  const totalSec = entries.reduce((n, e) => n + e.durationSec, 0)

  const groups: { key: string; label: string; items: typeof entries }[] = []
  for (const e of entries) {
    const key = dayKey(e.completedAt)
    const last = groups[groups.length - 1]
    if (last?.key === key) last.items.push(e)
    else groups.push({ key, label: dayLabel(e.completedAt), items: [e] })
  }

  return (
    <div>
      <h1>History</h1>
      <GoalRing editable />
      <Balance />
      <h2 className="meta">Last 12 weeks</h2>
      <Heatmap />
      <h2 className="meta">Milestones · {MILESTONES.filter((m) => m.id in unlocked).length}/{MILESTONES.length}</h2>
      <ul className="badges">
        {MILESTONES.map((m) => (
          <li key={m.id} className={`badge${m.id in unlocked ? '' : ' locked'}`}>
            <div className="medal" aria-hidden="true"><Icon name="award" size={20} /></div>
            <strong>{m.title}</strong>
            <div className="meta">{m.description}</div>
          </li>
        ))}
      </ul>
      {entries.length === 0 ? (
        <p className="empty">No completed sessions yet. Finish a session and it will show up here.</p>
      ) : (
        <>
          <p className="meta">
            {entries.length} session{entries.length === 1 ? '' : 's'} completed · {formatDuration(totalSec)} total
          </p>
          {groups.map((g) => (
            <section key={g.key}>
              <h2 className="meta">{g.label}</h2>
              <ul className="session-list">
                {g.items.map((e) => (
                  <li key={e.id} className="card">
                    <div className="session-top">
                      <div>
                        <strong>{e.sessionName}</strong>
                        <div className="meta">
                          {new Date(e.completedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {formatDuration(e.durationSec)}
                        </div>
                      </div>
                      <button className="btn small danger" onClick={() => deleteEntry(e.id)} aria-label={`Remove ${e.sessionName} from history`}>Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <div className="actions footer-actions">
            <button className="btn small danger" onClick={() => setConfirmClear(true)}>Clear history</button>
          </div>
        </>
      )}
      {confirmClear && (
        <Sheet title="Clear all history?" onClose={() => setConfirmClear(false)}>
          <p className="meta">This removes every completed session and resets your streak and goal progress. It cannot be undone.</p>
          <button className="btn primary" onClick={() => setConfirmClear(false)}>Keep history</button>
          <button className="btn danger" onClick={() => { clearHistory(); setConfirmClear(false) }}>Clear history</button>
        </Sheet>
      )}
    </div>
  )
}
