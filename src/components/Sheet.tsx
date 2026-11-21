import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Bottom sheet dialog: replaces window.confirm and holds secondary actions. Escape or the scrim closes it. */
export function Sheet({ title, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  // Callers pass inline callbacks (the player re-renders every 100 ms): keep the latest in a ref so the
  // effect below runs once per opening and does not keep pulling focus back to the first control.
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose })

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>('button, select, input')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current() }
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
