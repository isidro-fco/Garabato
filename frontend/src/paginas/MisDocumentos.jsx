import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { crearDocumento, eliminarDocumento, listarClases, listarDocumentos } from '../api.js'
import { Cargando, MensajeError } from '../componentes/Estado.jsx'
import { haceCuanto } from '../utils/fechas.js'
import { useCargar } from '../utils/useCargar.js'

export default function MisDocumentos() {
  const navigate = useNavigate()
  const [recarga, setRecarga] = useState(0)
  const [creando, setCreando] = useState(false)
  const [errorAccion, setErrorAccion] = useState(null)
  const documentos = useCargar(listarDocumentos, [recarga])
  // Solo para mostrar el nombre de la materia; si Classroom falla, la lista sigue funcionando.
  const clases = useCargar(() => listarClases().catch(() => []), [])
  const nombreClase = new Map(clases.datos?.map((c) => [c.id, c.nombre]))

  async function nuevo() {
    setCreando(true)
    try {
      const doc = await crearDocumento()
      navigate(`/documentos/${doc.id}`)
    } catch (error) {
      setErrorAccion(error)
      setCreando(false)
    }
  }

  async function eliminar(doc) {
    if (!window.confirm(`¿Eliminar "${doc.titulo}"? No se puede deshacer.`)) return
    try {
      await eliminarDocumento(doc.id)
      setRecarga((n) => n + 1)
    } catch (error) {
      setErrorAccion(error)
    }
  }

  return (
    <>
      <header className="encabezado encabezado-con-accion">
        <div>
          <h1>Mis documentos</h1>
          <p className="suave" style={{ margin: 0 }}>Se guardan solos mientras escribes.</p>
        </div>
        <button className="boton boton-primario" onClick={nuevo} disabled={creando}>
          {creando ? 'Creando…' : 'Nuevo documento'}
        </button>
      </header>

      {errorAccion && <MensajeError error={errorAccion} />}
      {documentos.cargando && <Cargando texto="Cargando tus documentos…" />}
      {documentos.error && <MensajeError error={documentos.error} />}
      {documentos.datos?.length === 0 && (
        <p className="mensaje">
          Todavía no tienes documentos. Crea uno aquí o desde una tarea en <Link to="/clases">Clases</Link>.
        </p>
      )}

      {documentos.datos?.length > 0 && (
        <ul className="lista-documentos">
          {documentos.datos.map((doc) => (
            <li key={doc.id}>
              <Link to={`/documentos/${doc.id}`} className="lista-documentos-enlace">
                <span className="lista-documentos-titulo">{doc.titulo}</span>
                <span className="suave">
                  {doc.cursoId && (nombreClase.get(doc.cursoId) ?? 'Clase de Classroom')}
                  {doc.cursoId && ' · '}
                  Editado {haceCuanto(doc.actualizadoEn)}
                </span>
              </Link>
              <button className="boton-texto texto-error" onClick={() => eliminar(doc)} aria-label={`Eliminar ${doc.titulo}`}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
