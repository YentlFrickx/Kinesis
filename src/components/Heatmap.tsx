import { useState } from 'react'
import { heatmap } from '../lib/progress'
import { useHistory } from '../store/history'

const label = (day: number, count: number) =>
  `${new Date(day).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}: ${count} session${count === 1 ? '' : 's'}`

export function Heatmap({ weeks = 12 }: { weeks?: number }) {
  const [now] = useState(Date.now)
  const grid = heatmap(useHistory(), now, weeks)
  return (
    <div className="heat" role="group" aria-label={`Activity, last ${weeks} weeks`}>
      {grid.map((week, w) => (
        <div key={w} className="heat-col">
          {week.map((d) => (
            <span
              key={d.day}
              className={`heat-cell${d.future ? ' future' : ''}`}
              data-level={Math.min(d.count, 3)}
              role="img"
              title={label(d.day, d.count)}
              aria-label={label(d.day, d.count)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
