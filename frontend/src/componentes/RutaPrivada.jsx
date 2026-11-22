import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { obtenerYo } from '../api.js'

// Envuelve las rutas privadas: si no hay sesión, manda a /login.
// Las páginas hijas leen al usuario con useOutletContext().
export default function RutaPrivada() {
  const [estado, setEstado] = useState({ cargando: true, usuario: null, error: null })

  useEffect(() => {
    obtenerYo()
      .then((usuario) => setEstado({ cargando: false, usuario, error: null }))
      .catch((error) => setEstado({ cargando: false, usuario: null, error }))
  }, [])

  if (estado.cargando) return <p style={{ padding: '2rem' }}>Cargando…</p>

  if (estado.error?.status === 401) return <Navigate to="/login" replace />

  if (estado.error) {
    return <p style={{ padding: '2rem' }}>No se pudo conectar con el servidor: {estado.error.message}</p>
  }

  return <Outlet context={{ usuario: estado.usuario }} />
}
