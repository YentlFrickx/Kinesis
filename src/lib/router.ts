import { useEffect, useState } from 'react'

const current = () => location.hash.replace(/^#/, '') || '/'

export function useRoute(): string {
  const [route, setRoute] = useState(current)
  useEffect(() => {
    const on = () => setRoute(current())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export const go = (path: string) => { location.hash = path }
