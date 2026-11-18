import { useRoute, go } from './lib/router'
import { ExerciseBrowser } from './screens/ExerciseBrowser'
import { Editor } from './screens/Editor'
import { Player } from './screens/Player'
import { Sessions } from './screens/Sessions'
import './App.css'

export default function App() {
  const route = useRoute()
  const [, section, id] = route.split('/')

  if (section === 'play' && id) return <main className="full"><Player key={id} id={id} /></main>

  let body
  if (section === 'session' && id) body = <Editor key={id} id={id} />
  else if (section === 'library') body = (<><h1>Exercises</h1><ExerciseBrowser /></>)
  else body = <Sessions />

  return (
    <>
      <main>{body}</main>
      <nav className="tabs" aria-label="Main">
        <button className={section === 'library' ? '' : 'on'} onClick={() => go('/')}>Sessions</button>
        <button className={section === 'library' ? 'on' : ''} onClick={() => go('/library')}>Exercises</button>
      </nav>
    </>
  )
}
