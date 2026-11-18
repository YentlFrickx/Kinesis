import { Icon } from '../components/Icon'
import { EXERCISE_MAP } from '../data/exercises'
import { copyText } from '../lib/clipboard'
import { workoutText } from '../lib/workoutText'
import { getSession } from '../store/sessions'
import { Sheet } from '../components/Sheet'
import { useState } from 'react'
import { Balance } from '../components/Balance'
import { GoalRing } from '../components/GoalRing'
import { Heatmap } from '../components/Heatmap'
import { formatDate, formatDuration, formatTime } from '../lib/format'
import { sessionLabel, useLocalize, useT } from '../i18n'
import { MILESTONES } from '../lib/progress'
import { clearHistory, deleteEntry, getHistory, restoreHistory, useHistory, type HistoryEntry } from '../store/history'
import { showToast } from '../store/toast'
import { useUnlocked } from '../store/milestones'

const dayKey = (t: number) => new Date(t).toDateString()
const dayLabel = (time: number, t: ReturnType<typeof useT>) => {
  const d = new Date(time)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 86_400_000)
  if (d.toDateString() === today.toDateString()) return t('history.today')
  if (d.toDateString() === yesterday.toDateString()) return t('history.yesterday')
  return formatDate(time, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function History() {
  const t = useT()
  const lx = useLocalize()
  const [confirmClear, setConfirmClear] = useState(false)
  const entries = useHistory()
  const unlocked = useUnlocked()
  // Entries recorded before items were stored fall back to the session as it is now (if it still exists).
  const items = (e: HistoryEntry) => e.items ?? getSession(e.sessionId)?.items
  const copy = async (e: HistoryEntry) => {
    const text = workoutText(sessionLabel(e.sessionId, e.sessionName), items(e) ?? [], (i) => { const x = EXERCISE_MAP.get(i); return x && lx(x) }, t)
    showToast(t((await copyText(text)) ? 'share.copied' : 'share.failed'))
  }
  const totalSec = entries.reduce((n, e) => n + e.durationSec, 0)

  const groups: { key: string; label: string; items: typeof entries }[] = []
  for (const e of entries) {
    const key = dayKey(e.completedAt)
    const last = groups[groups.length - 1]
    if (last?.key === key) last.items.push(e)
    else groups.push({ key, label: dayLabel(e.completedAt, t), items: [e] })
  }

  return (
    <div>
      <h1>{t('history.title')}</h1>
      <GoalRing editable />
      <Balance />
      <h2 className="meta">{t('history.last12')}</h2>
      <Heatmap />
      <h2 className="meta">{t('history.milestones', { done: MILESTONES.filter((m) => m in unlocked).length, total: MILESTONES.length })}</h2>
      <ul className="badges">
        {MILESTONES.map((m) => (
          <li key={m} className={`badge${m in unlocked ? '' : ' locked'}`}>
            <div className="medal" aria-hidden="true"><Icon name="award" size={20} /></div>
            <strong>{t(`milestone.${m}.title`)}</strong>
            <div className="meta">{t(`milestone.${m}.desc`)}</div>
          </li>
        ))}
      </ul>
      {entries.length === 0 ? (
        <p className="empty">{t('history.empty')}</p>
      ) : (
        <>
          <p className="meta">
            {t('history.total', { count: entries.length, duration: formatDuration(totalSec) })}
          </p>
          {groups.map((g) => (
            <section key={g.key}>
              <h2 className="meta">{g.label}</h2>
              <ul className="session-list">
                {g.items.map((e) => (
                  <li key={e.id} className="card">
                    <div className="session-top">
                      <div>
                        <strong>{sessionLabel(e.sessionId, e.sessionName)}</strong>
                        <div className="meta">
                          {formatTime(e.completedAt, { hour: '2-digit', minute: '2-digit' })} · {formatDuration(e.durationSec)}
                        </div>
                      </div>
                      <div className="actions">
                      {items(e) && (
                        <button className="btn small" onClick={() => copy(e)} aria-label={t('share.copyAria', { name: sessionLabel(e.sessionId, e.sessionName) })}><Icon name="copy" size={16} />{t('common.copy')}</button>
                      )}
                      <button className="btn small danger" onClick={() => deleteEntry(e.id)} aria-label={t('history.removeAria', { name: sessionLabel(e.sessionId, e.sessionName) })}>{t('common.remove')}</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <div className="actions footer-actions">
            <button className="btn small danger" onClick={() => setConfirmClear(true)}>{t('history.clear')}</button>
          </div>
        </>
      )}
      {confirmClear && (
        <Sheet title={t('history.clearTitle')} onClose={() => setConfirmClear(false)}>
          <p className="meta">{t('history.clearBody')}</p>
          <button className="btn primary" onClick={() => setConfirmClear(false)}>{t('history.keep')}</button>
          <button className="btn danger" onClick={() => {
            const snapshot = getHistory()
            clearHistory()
            showToast(t('history.cleared'), () => restoreHistory(snapshot))
            setConfirmClear(false) }}>{t('history.clear')}</button>
        </Sheet>
      )}
    </div>
  )
}
