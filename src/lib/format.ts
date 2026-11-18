export function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = Math.round(totalSec % 60)
  return m === 0 ? `${s}s` : s === 0 ? `${m} min` : `${m} min ${s}s`
}

export function formatClock(sec: number): string {
  const t = Math.ceil(sec)
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

export const describe = (mode: 'time' | 'reps', value: number, sets: number, perSide: boolean) =>
  `${sets > 1 ? `${sets} × ` : ''}${value}${mode === 'time' ? 's' : ' reps'}${perSide ? ' / side' : ''}`
