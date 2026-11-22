import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Bottom sheet dialog: replaces window.confirm and holds secondary actions. Escape or the scrim closes it. */
export function Sheet({ title, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  // Callers pass inline closures; keep the latest in a ref so the effect below runs only on open/close.
  // (Re-running it on every parent render — the player re-renders ~10×/s — kept snapping focus back to the first button.)
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose })

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>('button, select, input')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); close.current() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [])

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="grab" aria-hidden="true" />
        <h2 className="sheet-title">{title}</h2>
        {children}
      </div>
    </>
  )
}
