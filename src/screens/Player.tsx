import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Figure } from '../animation/Figure'
import { EXERCISE_MAP } from '../data/exercises'
import { formatClock } from '../lib/format'
import { go } from '../lib/router'
import { beep, isMuted, setMuted, speak, stopSpeaking, vibrate } from '../player/cues'
import { advance, buildSteps, goTo, initState, next, prev, type RunState, type Step } from '../player/engine'
import { youllNeed } from '../store/equipment'
import { MILESTONES, comebackDays } from '../lib/progress'
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
  const [state, setState] = useState<RunState>(() => initState(steps))
  const [paused, setPaused] = useState(false)
  const [muted, setMutedState] = useState(isMuted)
  const lastSec = useRef<number | null>(null)
  const activeMs = useRef(0)
  const recorded = useRef(false)
  const [reward, setReward] = useState<{ milestones: string[]; comeback: number } | null>(null)

  useWakeLock(!state.finished)

  // Timer loop
  useEffect(() => {
    if (paused || state.finished || steps.length === 0) return
    let last = performance.now()
    const t = setInterval(() => {
      const now = performance.now()
      const dt = now - last
      last = now
      activeMs.current += dt
      setState((s) => advance(steps, s, dt))
    }, 100)
    return () => clearInterval(t)
  }, [paused, state.finished, steps])

  const step = steps[state.index]

  // Announce each new step
  useEffect(() => {
    lastSec.current = null
    if (state.finished) {
      if (!recorded.current && session) {
        recorded.current = true
        const entry = recordCompletion(session.id, session.name, activeMs.current / 1000)
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

  useEffect(() => () => stopSpeaking(), [])

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
        <h1>Session complete 🎉</h1>
        <p className="meta">{session.name}</p>
        {reward && (reward.comeback > 0 || reward.milestones.length > 0) && (
          <div className="reward" role="status">
            {reward.comeback > 0 && <p>Welcome back! Great to see you again.</p>}
            {reward.milestones.map((id) => {
              const m = MILESTONES.find((x) => x.id === id)
              return m && <p key={id}>{m.emoji} <strong>{m.title}</strong> unlocked</p>
            })}
          </div>
        )}
        <button className="btn primary wide" onClick={() => go('/')}>Done</button>
        <button className="btn wide" onClick={() => { recorded.current = false; activeMs.current = 0; setReward(null); setState(goTo(steps, 0)); setPaused(false) }}>Do it again</button>
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

  return (
    <div className="player">
      <div className="player-top">
        <button className="link" onClick={() => confirm('Stop this session?') && go('/')}>✕ Quit</button>
        <span className="meta">{state.index + 1} / {total}</span>
        <button className="link" onClick={toggleMute} aria-pressed={muted}>{muted ? '🔇 Muted' : '🔊 Sound'}</button>
      </div>
      <progress max={total} value={state.index} aria-label="Session progress" />

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

      <Figure frames={exercise.animation} props={exercise.props} gear={exercise.gear} playing={!paused} label={`${exercise.name} animation`} className="player-figure" />

      <div className="big" aria-live="off">
        {isRepWork ? `${step.value} reps` : formatClock(state.remainingMs / 1000)}
      </div>

      <div className="controls">
        <button className="btn" onClick={() => setState(prev(steps, state))} disabled={state.index === 0}>⏮ Back</button>
        {isRepWork ? (
          <button className="btn primary big-btn" onClick={() => setState(next(steps, state))}>✓ Done</button>
        ) : (
          <button className="btn primary big-btn" onClick={() => setPaused((p) => !p)}>{paused ? '▶ Resume' : '⏸ Pause'}</button>
        )}
        <button className="btn" onClick={() => setState(next(steps, state))}>Skip ⏭</button>
      </div>
    </div>
  )
}
