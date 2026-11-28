import { Icon } from '../components/Icon'
import { isoDate } from '../lib/format'
import { Sheet } from '../components/Sheet'
import { LOCALES, LOCALE_INFO, setLocale, useLocale, useT } from '../i18n'
import { exportJson, missingStarters, restoreStarters, useSessions } from '../store/sessions'
import { THEME_OPTIONS, setTheme, useTheme } from '../store/theme'
import { VoiceSettings } from './VoiceSettings'

/** App settings sheet: appearance, voice, and session backup. `onMessage` reports import/restore results. */
export function SettingsSheet({ onClose, onMessage, fileRef }: {
  onClose: () => void
  onMessage: (m: string) => void
  fileRef: React.RefObject<HTMLInputElement | null>
}) {
  const sessions = useSessions()
  const theme = useTheme()
  const t = useT()
  const locale = useLocale()

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportJson()], { type: 'application/json' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `kinesis-backup-${isoDate(Date.now())}.json` })
    a.click()
    // Revoking synchronously can cancel the download in some browsers (Firefox, Safari).
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <Sheet title={t('settings.title')} onClose={onClose}>
      <div className="opt" role="group" aria-label={t('settings.appearance')}>
        <Icon name="moon" size={20} />{t('settings.appearance')}
        <div className="seg-pick">
          {THEME_OPTIONS.map((th) => (
            <button key={th} className={theme === th ? 'on' : ''} aria-pressed={theme === th} onClick={() => setTheme(th)}>{t(`theme.${th}`)}</button>
          ))}
        </div>
      </div>
      <div className="opt" role="group" aria-label={t('settings.language')}>
        <Icon name="globe" size={20} />{t('settings.language')}
        <div className="seg-pick">
          {LOCALES.map((l) => (
            <button key={l} lang={l} className={locale === l ? 'on' : ''} aria-pressed={locale === l} onClick={() => setLocale(l)}>{LOCALE_INFO[l].native}</button>
          ))}
        </div>
      </div>
      <VoiceSettings />
      <button className="opt" onClick={download} disabled={sessions.length === 0}><Icon name="download" size={20} />{t('settings.export')}</button>
      <button className="opt" onClick={() => { onClose(); fileRef.current?.click() }}><Icon name="upload" size={20} />{t('settings.import')}</button>
      {missingStarters(sessions).length > 0 && (
        <button className="opt" onClick={() => { onMessage(t('msg.restored', { count: restoreStarters() })) }}>
          <Icon name="refresh" size={20} />{t('settings.restore')}
        </button>
      )}
    </Sheet>
  )
}
