import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './documento.css'
import { iniciarColores } from './utils/coloresMarkdown.js'
import { iniciarTema } from './utils/tema.js'

// Tema elegido en Configuración (o el del sistema); shadcn/ui usa la clase .dark.
iniciarTema()
iniciarColores()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
