import { useState } from 'react'
import { go } from '../lib/router'
import { sessionsThisWeek } from '../lib/progress'
import { MAX_GOAL, setGoal, useGoal } from '../store/goal'
import { useHistory } from '../store/history'

const R = 26
const C = 2 * Math.PI * R

export function GoalRing({ editable = false }: { editable?: boolean }) {
  const [now] = useState(Date.now)
  const goal = useGoal()
  const done = sessionsThisWeek(useHistory(), now)
  const reached = done >= goal
  const body = (
    <>
      <svg viewBox="0 0 64 64" width="64" height="64" role="img" aria-label={`${done} of ${goal} sessions this week`}>
        <circle cx="32" cy="32" r={R} fill="none" stroke="var(--line)" strokeWidth="7" />
        <circle
          cx="32" cy="32" r={R} fill="none" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(1, done / goal))} transform="rotate(-90 32 32)"
        />
        <text x="32" y="37" textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--fg)">{reached ? '✓' : `${done}/${goal}`}</text>
      </svg>
      <div>
        <strong>{reached ? 'Weekly goal reached' : 'This week'}</strong>
        <div className="meta">
          {reached ? `${done} session${done === 1 ? '' : 's'} done. Anything extra is a bonus.` : `${done} of ${goal} sessions · ${goal - done} to go`}
        </div>
      </div>
    </>
  )

  return (
    <div className="card goal">
      {editable ? <div className="goal-main">{body}</div> : (
        <button className="goal-main link-reset" onClick={() => go('/history')}>{body}</button>
      )}
      {editable && (
        <div className="goal-edit">
          <span className="meta">Weekly goal</span>
          <button className="btn small" aria-label="Decrease weekly goal" disabled={goal <= 1} onClick={() => setGoal(goal - 1)}>−</button>
          <strong>{goal}</strong>
          <button className="btn small" aria-label="Increase weekly goal" disabled={goal >= MAX_GOAL} onClick={() => setGoal(goal + 1)}>+</button>
        </div>
      )}
    </div>
  )
}
