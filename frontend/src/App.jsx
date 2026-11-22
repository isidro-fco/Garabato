import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Cargando } from './componentes/Estado.jsx'
import RutaPrivada from './componentes/RutaPrivada.jsx'
import Clases from './paginas/Clases.jsx'
import Configuracion from './paginas/Configuracion.jsx'
import Login from './paginas/Login.jsx'
import Materia from './paginas/Materia.jsx'
import MisDocumentos from './paginas/MisDocumentos.jsx'
import Tarea from './paginas/Tarea.jsx'

// Las páginas con bibliotecas pesadas se descargan solo cuando se abren:
// FullCalendar (inicio), Markdown (editor) y Paged.js (impresión).
const Inicio = lazy(() => import('./paginas/Inicio.jsx'))
const Editor = lazy(() => import('./paginas/Editor.jsx'))
const Imprimir = lazy(() => import('./paginas/Imprimir.jsx'))

const diferida = (Pagina, clase) => <Suspense fallback={<Cargando className={clase} />}><Pagina /></Suspense>

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RutaPrivada />}>
          <Route path="/" element={diferida(Inicio)} />
          <Route path="/clases" element={<Clases />} />
          <Route path="/clases/:cursoId" element={<Materia />} />
          <Route path="/clases/:cursoId/tareas/:tareaId" element={<Tarea />} />
          <Route path="/documentos" element={<MisDocumentos />} />
          <Route path="/documentos/:docId" element={diferida(Editor)} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Route>
        <Route element={<RutaPrivada conBarra={false} />}>
          <Route path="/documentos/:docId/imprimir" element={diferida(Imprimir, 'm-8')} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
