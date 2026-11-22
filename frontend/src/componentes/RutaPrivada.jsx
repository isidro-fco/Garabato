import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { obtenerYo } from '../api.js'
import BarraLateral from './BarraLateral.jsx'
import { Cargando, MensajeError } from './Estado.jsx'

// Envuelve las rutas privadas: si no hay sesión, manda a /login.
// Muestra la barra lateral y las páginas hijas leen al usuario con useOutletContext().
// conBarra={false}: páginas sin la barra lateral, como la vista de impresión.
export default function RutaPrivada({ conBarra = true }) {
  const [estado, setEstado] = useState({ cargando: true, usuario: null, error: null })

  useEffect(() => {
    obtenerYo()
      .then((usuario) => setEstado({ cargando: false, usuario, error: null }))
      .catch((error) => setEstado({ cargando: false, usuario: null, error }))
  }, [])

  if (estado.cargando) return <Cargando className="m-8" />

  if (estado.error?.status === 401) return <Navigate to="/login" replace />

  if (estado.error) {
    return (
      <div className="m-8 max-w-lg">
        <MensajeError error={{ message: `No se pudo conectar con el servidor: ${estado.error.message}` }} />
      </div>
    )
  }

  if (!conBarra) return <Outlet context={{ usuario: estado.usuario }} />

  return (
    <div className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[220px_minmax(0,1fr)] md:grid-rows-1">
      <BarraLateral usuario={estado.usuario} />
      {/* El editor usa todo el ancho; las demás páginas, máximo 6xl. */}
      <main className="mx-auto w-full max-w-6xl min-w-0 px-4 py-5 md:px-10 md:py-8 has-[.editor]:max-w-none">
        <Outlet context={{ usuario: estado.usuario }} />
      </main>
    </div>
  )
}
