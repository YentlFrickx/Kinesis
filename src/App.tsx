import { Icon, type IconName } from './components/Icon'
import { useT, type MessageKey } from './i18n'
import { useRoute, go } from './lib/router'
import { Generator } from './screens/Generator'
import { ExerciseBrowser } from './screens/ExerciseBrowser'
import { Editor } from './screens/Editor'
import { History } from './screens/History'
import { Player } from './screens/Player'
import { Sessions } from './screens/Sessions'
import { Toast } from './components/Toast'
import './App.css'

const TABS: { key: string; path: string; label: MessageKey; icon: IconName }[] = [
  { key: 'sessions', path: '/', label: 'tab.sessions', icon: 'home' },
  { key: 'library', path: '/library', label: 'tab.exercises', icon: 'list' },
  { key: 'history', path: '/history', label: 'tab.history', icon: 'chart' },
]

export default function App() {
  const route = useRoute()
  const t = useT()
  const [, section, id] = route.split('/')

  if (section === 'play' && id) return <main className="full"><Player key={id} id={id} /></main>

  let body
  if (section === 'session' && id) body = <Editor key={id} id={id} />
  else if (section === 'generate') body = <Generator />
  else if (section === 'history') body = <History />
  else if (section === 'library') body = (<><h1>{t('browser.title')}</h1><ExerciseBrowser /></>)
  else body = <Sessions />

  const active = section === 'library' || section === 'history' ? section : 'sessions'

  return (
    <>
      <main>{body}</main>
      <nav className="tabs" aria-label={t('nav.main')}>
        <div className="in">
          {TABS.map((tab) => (
            <button key={tab.key} className={active === tab.key ? 'on' : ''} aria-current={active === tab.key ? 'page' : undefined} onClick={() => go(tab.path)}>
              <Icon name={tab.icon} />{t(tab.label)}
            </button>
          ))}
        </div>
      </nav>
      <Toast />
    </>
  )
}
