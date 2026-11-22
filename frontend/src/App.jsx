import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import RutaPrivada from './componentes/RutaPrivada.jsx'
import Clases from './paginas/Clases.jsx'
import Configuracion from './paginas/Configuracion.jsx'
import Editor from './paginas/Editor.jsx'
import Inicio from './paginas/Inicio.jsx'
import Login from './paginas/Login.jsx'
import Materia from './paginas/Materia.jsx'
import Tarea from './paginas/Tarea.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RutaPrivada />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/clases" element={<Clases />} />
          <Route path="/clases/:cursoId" element={<Materia />} />
          <Route path="/clases/:cursoId/tareas/:tareaId" element={<Tarea />} />
          <Route path="/documentos/nuevo" element={<Editor />} />
          <Route path="/configuracion" element={<Configuracion />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
