import { useT } from '../i18n'
import { dismissToast, useToast } from '../store/toast'

/** Transient message with an optional Undo action; mounted once in App. */
export function Toast() {
  const t = useT()
  const toast = useToast()
  if (!toast) return null
  return (
    <div className="toast" aria-live="polite" key={toast.id}>
      <span>{toast.message}</span>
      {toast.undo && (
        <button className="link" onClick={() => { toast.undo?.(); dismissToast() }}>{t('common.undo')}</button>
      )}
    </div>
  )
}
