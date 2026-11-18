import { Icon, type IconName } from './components/Icon'
import { useRoute, go } from './lib/router'
import { Generator } from './screens/Generator'
import { ExerciseBrowser } from './screens/ExerciseBrowser'
import { Editor } from './screens/Editor'
import { History } from './screens/History'
import { Player } from './screens/Player'
import { Sessions } from './screens/Sessions'
import './App.css'

const TABS: { key: string; path: string; label: string; icon: IconName }[] = [
  { key: 'sessions', path: '/', label: 'Sessions', icon: 'home' },
  { key: 'library', path: '/library', label: 'Exercises', icon: 'list' },
  { key: 'history', path: '/history', label: 'History', icon: 'chart' },
]

export default function App() {
  const route = useRoute()
  const [, section, id] = route.split('/')

  if (section === 'play' && id) return <main className="full"><Player key={id} id={id} /></main>

  let body
  if (section === 'session' && id) body = <Editor key={id} id={id} />
  else if (section === 'generate') body = <Generator />
  else if (section === 'history') body = <History />
  else if (section === 'library') body = (<><h1>Exercises</h1><ExerciseBrowser /></>)
  else body = <Sessions />

  const active = section === 'library' || section === 'history' ? section : 'sessions'

  return (
    <>
      <main>{body}</main>
      <nav className="tabs" aria-label="Main">
        <div className="in">
          {TABS.map((t) => (
            <button key={t.key} className={active === t.key ? 'on' : ''} aria-current={active === t.key ? 'page' : undefined} onClick={() => go(t.path)}>
              <Icon name={t.icon} />{t.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}
