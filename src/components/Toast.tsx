import { useT } from '../i18n'
import { dismissToast, useToast } from '../store/toast'

/** Transient message with an optional Undo action; mounted once in App. */
export function Toast() {
  const t = useT()
  const toast = useToast()
  // The live region stays mounted: screen readers ignore regions that appear together with their content.
  return (
    <div aria-live="polite">
      {toast && (
        <div className="toast" key={toast.id}>
          <span>{toast.message}</span>
          {toast.undo && (
            <button className="link" onClick={() => { toast.undo?.(); dismissToast() }}>{t('common.undo')}</button>
          )}
        </div>
      )}
    </div>
  )
}
