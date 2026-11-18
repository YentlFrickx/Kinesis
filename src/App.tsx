import { Figure } from './animation/Figure'
import { EXERCISES } from './data/exercises'
import './App.css'

export default function App() {
  return (
    <main>
      <h1>Runner workouts</h1>
      <div className="grid">
        {EXERCISES.map((e) => (
          <section key={e.id} className="card">
            <Figure frames={e.animation} label={`${e.name} animation`} />
            <h2>{e.name}</h2>
            <p className="meta">
              {e.defaultSets} × {e.defaultValue}{e.mode === 'time' ? 's' : ' reps'}
              {e.perSide ? ' per side' : ''}
            </p>
          </section>
        ))}
      </div>
    </main>
  )
}
