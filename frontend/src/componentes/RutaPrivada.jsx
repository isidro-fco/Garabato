import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { guardarColores, guardarMaterias, obtenerYo } from '../api.js'
import { hayElegidos, leerColores, normalizar, usarColores } from '../utils/coloresMarkdown.js'
import Bienvenida from '../paginas/Bienvenida.jsx'
import BarraLateral from './BarraLateral.jsx'
import { Cargando, MensajeError } from './Estado.jsx'

// Envuelve las rutas privadas: si no hay sesión, manda a /login.
// En el primer acceso pide escoger las materias (Bienvenida).
// Muestra la barra lateral y las páginas hijas leen con useOutletContext():
//   usuario, materias (ids elegidos o null = todas) y cambiarMaterias(ids),
//   colores (del editor) y cambiarColores(colores).
// conBarra={false}: páginas sin la barra lateral, como la vista de impresión.
export default function RutaPrivada({ conBarra = true }) {
  const [estado, setEstado] = useState({ cargando: true, usuario: null, error: null })
  // "Continuar sin elegir" en la bienvenida: no se vuelve a pedir en esta visita.
  const [omitido, setOmitido] = useState(false)

  useEffect(() => {
    obtenerYo()
      .then((usuario) => {
        setEstado({ cargando: false, usuario, error: null })
        // Los colores de la cuenta mandan. Si la cuenta aún no tiene y en este
        // navegador había colores elegidos (antes se guardaban solo aquí), se suben.
        if (usuario.colores) usarColores(usuario.colores)
        else if (hayElegidos(leerColores())) guardarColores(leerColores()).catch(() => {})
        else usarColores({})
      })
      .catch((error) => setEstado({ cargando: false, usuario: null, error }))
  }, [])

  if (estado.cargando) return <Cargando texto="Conectando con Garabato…" className="m-8" />

  if (estado.error?.status === 401) return <Navigate to="/login" replace />

  if (estado.error) {
    return (
      <div className="m-8 max-w-lg">
        <MensajeError error={estado.error} />
      </div>
    )
  }

  async function cambiarMaterias(ids) {
    const { materias } = await guardarMaterias(ids)
    setEstado((e) => ({ ...e, usuario: { ...e.usuario, materias } }))
  }
  // Guarda en la cuenta; los colores ya se aplicaron al elegirlos.
  async function cambiarColores(nuevos) {
    const { colores } = await guardarColores(nuevos)
    setEstado((e) => ({ ...e, usuario: { ...e.usuario, colores } }))
  }
  const contexto = {
    usuario: estado.usuario,
    materias: estado.usuario.materias ?? null,
    cambiarMaterias,
    colores: estado.usuario.colores ? normalizar(estado.usuario.colores) : leerColores(),
    cambiarColores,
  }

  if (!conBarra) return <Outlet context={contexto} />

  if (estado.usuario.materias == null && !omitido) {
    return <Bienvenida usuario={estado.usuario} onGuardar={cambiarMaterias} onOmitir={() => setOmitido(true)} />
  }

  return (
    <div className="grid min-h-screen grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[220px_minmax(0,1fr)] md:grid-rows-1">
      <BarraLateral usuario={estado.usuario} />
      {/* El editor usa todo el ancho; las demás páginas, máximo 6xl. */}
      <main className="mx-auto w-full max-w-6xl min-w-0 px-4 py-5 md:px-10 md:py-8 has-[.editor]:max-w-none">
        <Outlet context={contexto} />
      </main>
    </div>
  )
}
