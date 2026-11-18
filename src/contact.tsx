// Dev-only page: shows every keyframe pose of every exercise, to review animations.
// Run `npm run dev` and open /contact.html.
import { createRoot } from 'react-dom/client'
import { Figure } from './animation/Figure'
import { EXERCISES } from './data/exercises'
import './App.css'

createRoot(document.getElementById('root')!).render(
  <div style={{ padding: 12, display: 'grid', gap: 8 }}>
    {EXERCISES.map((e) => (
      <div key={e.id}>
        <strong>{e.name}</strong>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
          {e.animation.map((f, i) => (
            <Figure key={i} frames={e.animation} props={e.props} staticPose={f.pose} label={`${e.name} ${i}`} />
          ))}
        </div>
      </div>
    ))}
  </div>,
)
