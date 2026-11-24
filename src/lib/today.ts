import { useSyncExternalStore } from 'react'
import { startOfDay } from './progress'

// The snapshot is today's local midnight, so React only re-renders when the date actually changes.
// Ticks are cheap (an unchanged number is ignored); returning to the app checks straight away, which
// matters for an installed PWA that is resumed the next morning without reloading.
const CHECK_MS = 60_000

function subscribe(cb: () => void) {
  const timer = setInterval(cb, CHECK_MS)
  const onVis = () => { if (document.visibilityState === 'visible') cb() }
  document.addEventListener('visibilitychange', onVis)
  window.addEventListener('focus', cb)
  return () => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', onVis)
    window.removeEventListener('focus', cb)
  }
}

const today = () => startOfDay(Date.now())

/** Local midnight of the current day; updates when the date changes while the app stays open. */
export const useToday = () => useSyncExternalStore(subscribe, today)
