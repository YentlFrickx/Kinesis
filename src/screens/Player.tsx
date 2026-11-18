import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Figure } from '../animation/Figure'
import { EXERCISE_MAP } from '../data/exercises'
import type { Exercise } from '../data/types'
import { formatClock } from '../lib/format'
import { go } from '../lib/router'
import { beep, canSpeak, getAutoReps, isMuted, setAutoReps, setMuted, speak, stopSpeaking, vibrate } from '../player/cues'
import { getSpeechSettings } from '../player/speechSettings'
import { useVoices } from '../player/useVoices'
import { speaksCountdown, speaksReps } from '../player/voice'
import { LOCALE_INFO, sessionLabel, useLocale, useLocalize, useT } from '../i18n'
import { advance, buildSteps, goTo, initState, next, prev, SECONDS_PER_REP, type RunState, type Step } from '../player/engine'
import { Icon } from '../components/Icon'
import { Tips } from '../components/Tips'
import { Sheet } from '../components/Sheet'
import { youllNeed } from '../store/equipment'
import { comebackDays, sessionCategories, type MilestoneId } from '../lib/progress'
import { getHistory, recordCompletion } from '../store/history'
import { syncMilestones } from '../store/milestones'
import { getSession } from '../store/sessions'

type T = ReturnType<typeof useT>

const sideLabel = (s: 'left' | 'right' | null, t: T) => (s ? t(`side.${s}`) : '')

function announce(step: Step, t: T, lx: (e: Exercise) => Exercise): string {
  if (step.kind === 'work') {
    const name = lx(step.exercise).name
    return step.side ? t('player.say.workSide', { name, side: t(`side.${step.side}Short`) }) : t('player.say.work', { name })
  }
  if (step.reason === 'switch') return t('player.say.switch')
  if (step.reason === 'set') return t('player.say.rest')
  return t('player.say.getReady', { name: lx(step.next).name })
}

function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    const acquire = () => navigator.wakeLock.request('screen').then((l) => { lock = l }).catch(() => {})
    void acquire()
    const onVis = () => document.visibilityState === 'visible' && void acquire()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      void lock?.release()
    }
  }, [active])
}

export function Player({ id }: { id: string }) {
  const t = useT()
  const lx = useLocalize()
  const locale = useLocale()
  const { status: voiceStatus } = useVoices(locale)
  const interrupt = useRef(false) // set when the user navigates, so the new cue cuts off a stale one
  const session = getSession(id)
  const steps = useMemo(() => (session ? buildSteps(session, (i) => EXERCISE_MAP.get(i)) : []), [session])
  const [autoReps, setAutoRepsState] = useState(getAutoReps)
  const [state, setState] = useState<RunState>(() => initState(steps, autoReps))
  const [paused, setPaused] = useState(false)
  const [muted, setMutedState] = useState(isMuted)
  const [sheet, setSheet] = useState<'quit' | 'settings' | null>(null)
  const lastSec = useRef<number | null>(null)
  const activeMs = useRef(0)
  const recorded = useRef(false)
  const [reward, setReward] = useState<{ milestones: string[]; comeback: number } | null>(null)
  const nav = (fn: () => void) => { interrupt.current = true; fn() }

  useWakeLock(!state.finished)

  // Timer loop. Timestamp-based: each tick applies the real time elapsed since the last tick, so a
  // throttled/stalled interval (locked screen, background tab) cannot cause drift. On return to the
  // foreground the first tick carries the whole gap through as many steps as it covers.
  useEffect(() => {
    if (paused || state.finished || steps.length === 0) return
    let last = Date.now()
    const tick = () => {
      const now = Date.now()
      const dt = Math.max(0, now - last)
      last = now
      activeMs.current += dt
      setState((s) => advance(steps, s, dt, autoReps))
    }
    const t = setInterval(tick, 100)
    const onVis = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [paused, state.finished, steps, autoReps])

  const step = steps[state.index]

  // Announce each new step
  useEffect(() => {
    lastSec.current = null
    if (state.finished) {
      if (!recorded.current && session) {
        recorded.current = true
        const entry = recordCompletion(
          session.id, sessionLabel(session.id, session.name), activeMs.current / 1000,
          sessionCategories(session, (i) => EXERCISE_MAP.get(i)?.category),
        )
        setReward({
          milestones: syncMilestones(),
          comeback: comebackDays(getHistory()[1]?.completedAt, entry.completedAt),
        })
      }
      beep(660, 200); setTimeout(() => beep(880, 300), 250)
      speak(t('player.completeSpoken'), { interrupt: true })
      vibrate([200, 100, 200, 100, 400])
      return
    }
    if (!step) return
    beep(step.kind === 'work' ? 1040 : 520, 200)
    speak(announce(step, t, lx), { priority: 'step', interrupt: interrupt.current })
    // The first cue is spoken once, at the start of an exercise (first set, first side), unless verbosity is names-only.
    if (step.kind === 'work' && step.set === 1 && step.side !== 'right' && getSpeechSettings().verbosity !== 'names') {
      const cue = lx(step.exercise).cues?.[0]
      if (cue) speak(cue, { priority: 'count' })
    }
    interrupt.current = false
    vibrate(step.kind === 'work' ? 200 : 80)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, state.finished])

  // Countdown beeps at 3, 2, 1
  useEffect(() => {
    if (state.finished || !Number.isFinite(state.remainingMs) || paused) return
    const sec = Math.ceil(state.remainingMs / 1000)
    if (sec !== lastSec.current) {
      lastSec.current = sec
      if (sec >= 1 && sec <= 3) {
        // A spoken number replaces the beep when it can be heard; otherwise fall back to the beep.
        const spoken = speaksCountdown(getSpeechSettings().verbosity) && canSpeak() && speak(String(sec), { priority: 'count' })
        if (!spoken) beep(760, 90)
        vibrate(40)
      }
    }
  }, [state.remainingMs, state.finished, paused])

  // Spoken rep count while auto-advancing rep steps
  const lastRep = useRef(0)
  useEffect(() => { lastRep.current = 0 }, [state.index])
  useEffect(() => {
    if (!speaksReps(getSpeechSettings().verbosity) || !autoReps || paused || state.finished || !step || step.kind !== 'work' || step.mode !== 'reps') return
    const done = step.value - Math.ceil(state.remainingMs / (SECONDS_PER_REP * 1000))
    if (done > lastRep.current) {
      lastRep.current = done
      if (done < step.value) speak(String(done), { priority: 'count' })
    }
  }, [state.remainingMs, state.index, state.finished, autoReps, paused, step])

  useEffect(() => () => stopSpeaking(), [])

  const toggleAutoReps = useCallback(() => {
    const on = !autoReps
    setAutoReps(on)
    setAutoRepsState(on)
    // Re-seat the current rep step so it switches between manual and paced immediately.
    setState((s) => (!s.finished && steps[s.index]?.kind === 'work' && (steps[s.index] as { mode: string }).mode === 'reps' ? goTo(steps, s.index, on) : s))
  }, [autoReps, steps])

  const toggleMute = useCallback(() => {
    setMutedState((m) => { setMuted(!m); return !m })
  }, [])

  if (!session || steps.length === 0) {
    return (
      <div>
        <p className="empty">{t('player.nothing')}</p>
        <button className="btn" onClick={() => go('/')}>{t('common.back')}</button>
      </div>
    )
  }

  if (state.finished) {
    return (
      <div className="player done">
        <div className="done-mark" aria-hidden="true"><Icon name="check" size={44} /></div>
        <h1>{t('player.complete')}</h1>
        <p className="meta">{sessionLabel(session.id, session.name)}</p>
        {reward && (reward.comeback > 0 || reward.milestones.length > 0) && (
          <div className="reward" role="status">
            {reward.comeback > 0 && <p>{t('player.welcomeBack')}</p>}
            {(reward.milestones as MilestoneId[]).map((id) => (
              <p key={id}><Icon name="award" size={18} /><span>{t('player.unlocked', { title: t(`milestone.${id}.title`) })}</span></p>
            ))}
          </div>
        )}
        <button className="btn primary wide" onClick={() => go('/')}>{t('common.done')}</button>
        <button className="btn wide" onClick={() => { recorded.current = false; activeMs.current = 0; setReward(null); setState(goTo(steps, 0, autoReps)); setPaused(false) }}>{t('player.again')}</button>
      </div>
    )
  }

  const exercise = lx(step.kind === 'work' ? step.exercise : step.next)
  const isRepWork = step.kind === 'work' && step.mode === 'reps'
  const total = steps.length
  const heading =
    step.kind === 'work'
      ? exercise.name
      : step.reason === 'switch'
        ? t('player.heading.switch')
        : step.reason === 'set'
          ? t('player.heading.set')
          : step.reason === 'start' ? t('player.heading.start') : t('player.heading.next')

  const segments = session.items.map((_, i) => {
    const idx = steps.map((x, n) => (x.itemIndex === i ? n : -1)).filter((n) => n >= 0)
    if (idx.length === 0) return 0
    return Math.min(1, Math.max(0, (state.index - idx[0]) / idx.length))
  })
  const eyebrow = step.kind === 'work' ? t('player.eyebrow.work') : step.reason === 'switch' ? t('player.eyebrow.switch') : step.reason === 'start' ? t('player.eyebrow.start') : t('player.eyebrow.rest')

  return (
    <div className="player">
      <div className="player-top">
        <button className="icon-btn" aria-label={t('player.end')} onClick={() => setSheet('quit')}><Icon name="x" /></button>
        <span className="meta" aria-label={t('player.stepOf', { n: state.index + 1, total })}>{state.index + 1} / {total}</span>
        <button className="icon-btn" aria-label={t('player.settings')} onClick={() => setSheet('settings')}><Icon name="sliders" /></button>
      </div>
      {!muted && (voiceStatus === 'no-voice' || voiceStatus === 'unsupported') && (
        <p className="meta speech-hint" role="status">
          {t(voiceStatus === 'no-voice' ? 'voice.hint.none' : 'voice.hint.unsupported', { language: LOCALE_INFO[locale].native })}
        </p>
      )}
      <ol className="segs" aria-label={t('player.progress')}>
        {segments.map((f, i) => <li key={i}><i style={{ width: `${f * 100}%` }} /></li>)}
      </ol>

      <div className="player-head">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="player-title">{heading}</h1>
        {step.kind === 'rest' && step.reason === 'start' && youllNeed(session) && <p className="sub">{youllNeed(session)}</p>}
        {step.kind === 'rest' && <p className="sub">{t('player.upNext', { name: '\u0000' }).split('\u0000').flatMap((part, i) => (i === 0 ? [part] : [<strong key="n">{lx(step.next).name}</strong>, part]))}{step.side ? ` · ${sideLabel(step.side, t)}` : ''}</p>}
        {step.kind === 'work' && (
          <p className="sub">
            {step.sets > 1 ? t('player.setOf', { set: step.set, sets: step.sets }) : ''}
            {step.sets > 1 && step.side ? ' · ' : ''}
            {sideLabel(step.side, t)}
          </p>
        )}
      </div>

      <div className={`player-stage${step.kind === 'rest' ? ' rest' : ''}`}>
        <Figure frames={exercise.animation} props={exercise.props} gear={exercise.gear} playing={!paused} label={t('sessions.animation', { name: exercise.name })} className="player-figure" />
      </div>

      <div className="big" aria-live="off">
        {isRepWork ? <>{step.value}<small>{t('player.repsLabel')}</small></> : formatClock(state.remainingMs / 1000)}
      </div>

      {session.items[step.itemIndex]?.note && <p className="note-line">{session.items[step.itemIndex].note}</p>}
      <div className="player-tips"><Tips key={exercise.id} exercise={exercise} /></div>

      <div className="controls">
        <button className="icon-btn" aria-label={t('player.prev')} onClick={() => nav(() => setState(prev(steps, state, autoReps)))} disabled={state.index === 0}><Icon name="prev" /></button>
        {isRepWork && !autoReps ? (
          <button className="big-btn" onClick={() => nav(() => setState(next(steps, state, autoReps)))}><Icon name="check" />{t('common.done')}</button>
        ) : (
          <button className="big-btn" onClick={() => setPaused((p) => !p)}>{paused ? <><Icon name="play" size={20} />{t('player.resume')}</> : <><Icon name="pause" size={20} />{t('player.pause')}</>}</button>
        )}
        <button className="icon-btn" aria-label={t('player.skip')} onClick={() => nav(() => setState(next(steps, state, autoReps)))}><Icon name="next" /></button>
      </div>

      {sheet === 'quit' && (
        <Sheet title={t('player.quitTitle')} onClose={() => setSheet(null)}>
          <p className="meta">{t('player.quitBody')}</p>
          <button className="btn primary" onClick={() => setSheet(null)}>{t('player.keepGoing')}</button>
          <button className="btn" onClick={() => go('/')}>{t('player.end')}</button>
        </Sheet>
      )}
      {sheet === 'settings' && (
        <Sheet title={t('player.soundTitle')} onClose={() => setSheet(null)}>
          <button className="opt" role="switch" aria-checked={!muted} onClick={toggleMute}><Icon name={muted ? 'mute' : 'vol'} size={20} />{t('player.sound')}<span className={`sw${muted ? '' : ' on'}`} /></button>
          <button className="opt" role="switch" aria-checked={autoReps} onClick={toggleAutoReps}><Icon name="repeat" size={20} />{t('player.autoReps')}<span className={`sw${autoReps ? ' on' : ''}`} /></button>
        </Sheet>
      )}
    </div>
  )
}
