import { useT } from '../i18n'
import { formatDate } from '../lib/format'
import { heatmap } from '../lib/progress'
import { useToday } from '../lib/today'
import { useHistory } from '../store/history'

export function Heatmap({ weeks = 12 }: { weeks?: number }) {
  const t = useT()
  const label = (day: number, count: number) =>
    `${formatDate(day, { weekday: 'short', day: 'numeric', month: 'short' })}: ${t('sessions.sessionCount', { count })}`
  const now = useToday()
  const grid = heatmap(useHistory(), now, weeks)
  return (
    <div className="heat" role="group" aria-label={t('history.activityAria', { weeks })}>
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
