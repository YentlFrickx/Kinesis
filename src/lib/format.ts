import { getLocale, t } from '../i18n'

export function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = Math.round(totalSec % 60)
  return m === 0 ? t('unit.seconds', { n: s }) : s === 0 ? t('unit.minutes', { n: m }) : t('unit.minutesSeconds', { m, s })
}

export function formatClock(sec: number): string {
  const tt = Math.ceil(sec)
  return `${Math.floor(tt / 60)}:${String(tt % 60).padStart(2, '0')}`
}

export const describe = (mode: 'time' | 'reps', value: number, sets: number, perSide: boolean) =>
  `${sets > 1 ? `${t('unit.sets', { n: sets })} ` : ''}${mode === 'time' ? t('unit.seconds', { n: value }) : t('unit.reps', { n: value })}${perSide ? ` ${t('unit.perSide')}` : ''}`

/** Locale-aware date/time formatting (Intl) in the current language. */
export const formatDate = (time: number, opts: Intl.DateTimeFormatOptions) => new Date(time).toLocaleDateString(getLocale(), opts)
export const formatTime = (time: number, opts: Intl.DateTimeFormatOptions) => new Date(time).toLocaleTimeString(getLocale(), opts)

/** Narrow weekday letters, Monday first. */
export const weekdayLetters = () => {
  const f = new Intl.DateTimeFormat(getLocale(), { weekday: 'narrow' })
  return Array.from({ length: 7 }, (_, i) => f.format(new Date(2024, 0, 1 + i))) // 2024-01-01 is a Monday
}
