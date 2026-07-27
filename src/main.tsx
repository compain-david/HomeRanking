import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyTheme, readTheme } from './theme'
import { installErrorLogging } from './errorlog'
import './fonts.css'
import './styles.css'

installErrorLogging()
applyTheme(readTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
