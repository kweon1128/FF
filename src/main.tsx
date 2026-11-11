import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@sun-typeface/suit/fonts/variable/woff2/SUIT-Variable.css'
import './index.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
