import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Figure } from '../animation/Figure'
import { EXERCISE_MAP } from '../data/exercises'
import { formatClock } from '../lib/format'
import { go } from '../lib/router'
import { beep, getAutoReps, isMuted, setAutoReps, setMuted, speak, stopSpeaking, vibrate } from '../player/cues'
import { advance, buildSteps, goTo, initState, next, prev, SECONDS_PER_REP, type RunState, type Step } from '../player/engine'
import { Icon } from '../components/Icon'
import { Sheet } from '../components/Sheet'
import { youllNeed } from '../store/equipment'
import { MILESTONES, comebackDays, sessionCategories } from '../lib/progress'
import { getHistory, recordCompletion } from '../store/history'
import { syncMilestones } from '../store/milestones'
import { getSession } from '../store/sessions'

const sideLabel = (s: 'left' | 'right' | null) => (s ? `${s[0].toUpperCase()}${s.slice(1)} side` : '')

function announce(step: Step): string {
  if (step.kind === 'work') {
    return `${step.exercise.name}${step.side ? `, ${step.side} side` : ''}`
  }
  if (step.reason === 'switch') return 'Switch sides'
  if (step.reason === 'set') return 'Rest'
  return `Get ready. ${step.next.name}`
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
          session.id, session.name, activeMs.current / 1000,
          sessionCategories(session, (i) => EXERCISE_MAP.get(i)?.category),
        )
        setReward({
          milestones: syncMilestones(),
          comeback: comebackDays(getHistory()[1]?.completedAt, entry.completedAt),
        })
      }
      beep(660, 200); setTimeout(() => beep(880, 300), 250)
      speak('Session complete. Well done!')
      vibrate([200, 100, 200, 100, 400])
      return
    }
    if (!step) return
    beep(step.kind === 'work' ? 1040 : 520, 200)
    speak(announce(step))
    vibrate(step.kind === 'work' ? 200 : 80)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, state.finished])

  // Countdown beeps at 3, 2, 1
  useEffect(() => {
    if (state.finished || !Number.isFinite(state.remainingMs) || paused) return
    const sec = Math.ceil(state.remainingMs / 1000)
    if (sec !== lastSec.current) {
      lastSec.current = sec
      if (sec >= 1 && sec <= 3) { beep(760, 90); vibrate(40) }
    }
  }, [state.remainingMs, state.finished, paused])

  // Spoken rep count while auto-advancing rep steps
  const lastRep = useRef(0)
  useEffect(() => { lastRep.current = 0 }, [state.index])
  useEffect(() => {
    if (!autoReps || paused || state.finished || !step || step.kind !== 'work' || step.mode !== 'reps') return
    const done = step.value - Math.ceil(state.remainingMs / (SECONDS_PER_REP * 1000))
    if (done > lastRep.current) {
      lastRep.current = done
      if (done < step.value) speak(String(done))
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
        <p className="empty">Nothing to play. Add exercises to this session first.</p>
        <button className="btn" onClick={() => go('/')}>Back</button>
      </div>
    )
  }

  if (state.finished) {
    return (
      <div className="player done">
        <div className="done-mark" aria-hidden="true"><Icon name="check" size={44} /></div>
        <h1>Session complete</h1>
        <p className="meta">{session.name}</p>
        {reward && (reward.comeback > 0 || reward.milestones.length > 0) && (
          <div className="reward" role="status">
            {reward.comeback > 0 && <p>Welcome back! Great to see you again.</p>}
            {reward.milestones.map((id) => {
              const m = MILESTONES.find((x) => x.id === id)
              return m && <p key={id}><Icon name="award" size={18} /><span><strong>{m.title}</strong> unlocked</span></p>
            })}
          </div>
        )}
        <button className="btn primary wide" onClick={() => go('/')}>Done</button>
        <button className="btn wide" onClick={() => { recorded.current = false; activeMs.current = 0; setReward(null); setState(goTo(steps, 0, autoReps)); setPaused(false) }}>Do it again</button>
      </div>
    )
  }

  const exercise = step.kind === 'work' ? step.exercise : step.next
  const isRepWork = step.kind === 'work' && step.mode === 'reps'
  const total = steps.length
  const heading =
    step.kind === 'work'
      ? step.exercise.name
      : step.reason === 'switch'
        ? 'Switch sides'
        : step.reason === 'set'
          ? 'Rest'
          : step.reason === 'start' ? 'Get ready' : 'Next up'

  const segments = session.items.map((_, i) => {
    const idx = steps.map((x, n) => (x.itemIndex === i ? n : -1)).filter((n) => n >= 0)
    if (idx.length === 0) return 0
    return Math.min(1, Math.max(0, (state.index - idx[0]) / idx.length))
  })
  const eyebrow = step.kind === 'work' ? 'Exercise' : step.reason === 'switch' ? 'Change side' : step.reason === 'start' ? 'Starting soon' : 'Recover'

  return (
    <div className="player">
      <div className="player-top">
        <button className="icon-btn" aria-label="End session" onClick={() => setSheet('quit')}><Icon name="x" /></button>
        <span className="meta" aria-label={`Step ${state.index + 1} of ${total}`}>{state.index + 1} / {total}</span>
        <button className="icon-btn" aria-label="Settings" onClick={() => setSheet('settings')}><Icon name="sliders" /></button>
      </div>
      <ol className="segs" aria-label="Session progress">
        {segments.map((f, i) => <li key={i}><i style={{ width: `${f * 100}%` }} /></li>)}
      </ol>

      <div className="player-head">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="player-title">{heading}</h1>
        {step.kind === 'rest' && step.reason === 'start' && youllNeed(session) && <p className="sub">{youllNeed(session)}</p>}
        {step.kind === 'rest' && <p className="sub">Up next: <strong>{step.next.name}</strong>{step.side ? ` · ${sideLabel(step.side)}` : ''}</p>}
        {step.kind === 'work' && (
          <p className="sub">
            {step.sets > 1 ? `Set ${step.set} of ${step.sets}` : ''}
            {step.sets > 1 && step.side ? ' · ' : ''}
            {sideLabel(step.side)}
          </p>
        )}
      </div>

      <div className={`player-stage${step.kind === 'rest' ? ' rest' : ''}`}>
        <Figure frames={exercise.animation} props={exercise.props} gear={exercise.gear} playing={!paused} label={`${exercise.name} animation`} className="player-figure" />
      </div>

      <div className="big" aria-live="off">
        {isRepWork ? <>{step.value}<small>reps</small></> : formatClock(state.remainingMs / 1000)}
      </div>

      <div className="controls">
        <button className="icon-btn" aria-label="Back" onClick={() => setState(prev(steps, state, autoReps))} disabled={state.index === 0}><Icon name="prev" /></button>
        {isRepWork && !autoReps ? (
          <button className="big-btn" onClick={() => setState(next(steps, state, autoReps))}><Icon name="check" />Done</button>
        ) : (
          <button className="big-btn" onClick={() => setPaused((p) => !p)}>{paused ? <><Icon name="play" size={20} />Resume</> : <><Icon name="pause" size={20} />Pause</>}</button>
        )}
        <button className="icon-btn" aria-label="Skip" onClick={() => setState(next(steps, state, autoReps))}><Icon name="next" /></button>
      </div>

      {sheet === 'quit' && (
        <Sheet title="End this session?" onClose={() => setSheet(null)}>
          <p className="meta">Your progress so far is not saved.</p>
          <button className="btn primary" onClick={() => setSheet(null)}>Keep going</button>
          <button className="btn" onClick={() => go('/')}>End session</button>
        </Sheet>
      )}
      {sheet === 'settings' && (
        <Sheet title="Sound and pacing" onClose={() => setSheet(null)}>
          <button className="opt" role="switch" aria-checked={!muted} onClick={toggleMute}><Icon name={muted ? 'mute' : 'vol'} size={20} />Sound cues<span className={`sw${muted ? '' : ' on'}`} /></button>
          <button className="opt" role="switch" aria-checked={autoReps} onClick={toggleAutoReps}><Icon name="repeat" size={20} />Auto-pace reps<span className={`sw${autoReps ? ' on' : ''}`} /></button>
        </Sheet>
      )}
    </div>
  )
}
