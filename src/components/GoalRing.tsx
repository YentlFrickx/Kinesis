import { useState } from 'react'
import { go } from '../lib/router'
import { sessionsThisWeek } from '../lib/progress'
import { MAX_GOAL, setGoal, useGoal } from '../store/goal'
import { useHistory } from '../store/history'
import { Icon } from './Icon'

const R = 26
const C = 2 * Math.PI * R

export function GoalRing({ editable = false, size = 64 }: { editable?: boolean; size?: number }) {
  const [now] = useState(Date.now)
  const goal = useGoal()
  const done = sessionsThisWeek(useHistory(), now)
  const reached = done >= goal
  const body = (
    <>
      <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={`${done} of ${goal} sessions this week`}>
        <circle cx="32" cy="32" r={R} fill="none" stroke="var(--ring-bg)" strokeWidth="7" />
        <circle
          cx="32" cy="32" r={R} fill="none" stroke="var(--ring-fg)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(1, done / goal))} transform="rotate(-90 32 32)"
        />
        <text x="32" y="37" textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--fg)">{reached ? '✓' : `${done}/${goal}`}</text>
      </svg>
      <div>
        <strong>{reached ? 'Weekly goal reached' : `${done} of ${goal} this week`}</strong>
        <div className="meta">
          {reached ? `${done} session${done === 1 ? '' : 's'} done. Anything extra is a bonus.` : `${goal - done} to go`}
        </div>
      </div>
    </>
  )

  if (!editable) {
    return <button className="goal-main link-reset" onClick={() => go('/history')}>{body}</button>
  }
  return (
    <div className="card goal">
      <div className="goal-main">{body}</div>
      <div className="goal-edit">
        <span className="meta">Weekly goal</span>
        <button className="btn small" aria-label="Decrease weekly goal" disabled={goal <= 1} onClick={() => setGoal(goal - 1)}><Icon name="minus" size={16} /></button>
        <strong>{goal}</strong>
        <button className="btn small" aria-label="Increase weekly goal" disabled={goal >= MAX_GOAL} onClick={() => setGoal(goal + 1)}><Icon name="plus" size={16} /></button>
      </div>
    </div>
  )
}
