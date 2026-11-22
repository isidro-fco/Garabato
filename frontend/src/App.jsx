import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import RutaPrivada from './componentes/RutaPrivada.jsx'
import Inicio from './paginas/Inicio.jsx'
import Login from './paginas/Login.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RutaPrivada />}>
          <Route path="/" element={<Inicio />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
