import './fonts.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { initLocale } from './i18n'
import { installSpeechPrime } from './player/cues'
import { initTheme } from './store/theme'

initTheme()
initLocale()
installSpeechPrime()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
