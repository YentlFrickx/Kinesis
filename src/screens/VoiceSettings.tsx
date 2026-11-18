import { Icon } from '../components/Icon'
import { LOCALE_INFO, useLocale, useT } from '../i18n'
import { speak, speechSupported } from '../player/cues'
import { setVoiceFor, updateSpeechSettings, useSpeechSettings } from '../player/speechSettings'
import { useVoices } from '../player/useVoices'
import { RATE_RANGE, VERBOSITIES, type Verbosity } from '../player/voice'

/** Spoken-cue settings: voice per language, rate, volume and how much is said. */
export function VoiceSettings() {
  const t = useT()
  const locale = useLocale()
  const settings = useSpeechSettings()
  const { voices, status } = useVoices(locale)
  const language = LOCALE_INFO[locale].native

  if (!speechSupported()) return <p className="meta">{t('voice.unsupported')}</p>

  const saved = settings.voices[locale] ?? ''
  const selected = voices.some((v) => v.voiceURI === saved) ? saved : ''
  const test = () => speak(t('voice.testPhrase'), { force: true, interrupt: true })

  return (
    <div className="opt" style={{ display: 'block' }}>
      <label htmlFor="voice-select"><strong>{t('voice.title')}</strong> <span className="meta">({language})</span></label>
      <div className="voice-row">
        <select id="voice-select" value={selected} disabled={voices.length === 0}
          onChange={(e) => { setVoiceFor(locale, e.target.value || null); setTimeout(test, 0) }}>
          <option value="">{t('voice.auto', { language })}</option>
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
          ))}
        </select>
        <button className="btn small" onClick={test} disabled={status === 'no-voice'}><Icon name="play" size={14} />{t('voice.test')}</button>
      </div>
      {status === 'no-voice' && <p className="meta" role="status">{t('voice.none', { language })}</p>}
      {status === 'loading' && <p className="meta" role="status">{t('voice.loading')}</p>}

      <div className="voice-field">
        <label htmlFor="voice-rate">{t('voice.rate')}</label>
        <input id="voice-rate" type="range" min={RATE_RANGE.min} max={RATE_RANGE.max} step={RATE_RANGE.step} value={settings.rate}
          onChange={(e) => updateSpeechSettings({ rate: Number(e.target.value) })} onPointerUp={test} onKeyUp={test} />
        <span className="meta">{settings.rate.toFixed(1)}×</span>
      </div>
      <div className="voice-field">
        <label htmlFor="voice-volume">{t('voice.volume')}</label>
        <input id="voice-volume" type="range" min={0} max={1} step={0.1} value={settings.volume}
          onChange={(e) => updateSpeechSettings({ volume: Number(e.target.value) })} onPointerUp={test} onKeyUp={test} />
        <span className="meta">{Math.round(settings.volume * 100)}%</span>
      </div>
      <div className="voice-field">
        <label htmlFor="voice-verbosity">{t('voice.verbosity')}</label>
        <select id="voice-verbosity" value={settings.verbosity} onChange={(e) => updateSpeechSettings({ verbosity: e.target.value as Verbosity })}>
          {VERBOSITIES.map((v) => <option key={v} value={v}>{t(`voice.verbosity.${v}`)}</option>)}
        </select>
      </div>
    </div>
  )
}
