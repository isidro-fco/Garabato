import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { crearDocumento, listarDocumentos, obtenerTarea } from '../api.js'
import { Cargando, Etiqueta, MensajeError } from '../componentes/Estado.jsx'
import { haceCuanto } from '../utils/fechas.js'
import { estadoTarea, formatearFecha } from '../utils/tareas.js'
import { useCargar } from '../utils/useCargar.js'

const TIPOS_MATERIAL = { drive: 'Drive', enlace: 'Enlace', youtube: 'YouTube', formulario: 'Formulario' }

// Vista de instrucciones de una tarea.
export default function Tarea() {
  const { cursoId, tareaId } = useParams()
  const navigate = useNavigate()
  const { cargando, datos: tarea, error } = useCargar(() => obtenerTarea(cursoId, tareaId), [cursoId, tareaId])
  const documentos = useCargar(() => listarDocumentos({ tareaId }), [tareaId])
  const [creando, setCreando] = useState(false)
  const [errorCrear, setErrorCrear] = useState(null)

  if (cargando) return <Cargando texto="Cargando la tarea…" />
  if (error) return <MensajeError error={error} />

  const estado = estadoTarea(tarea)

  async function nuevoDocumento() {
    setCreando(true)
    try {
      const doc = await crearDocumento({ titulo: tarea.titulo, cursoId, tareaId })
      navigate(`/documentos/${doc.id}`)
    } catch (err) {
      setErrorCrear(err)
      setCreando(false)
    }
  }

  return (
    <>
      <nav className="migas" aria-label="Ruta">
        <Link to="/clases">Clases</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/clases/${cursoId}`}>{tarea.curso ?? 'Clase'}</Link>
        <span aria-hidden="true">/</span>
        <span>{tarea.titulo}</span>
      </nav>

      <header className="encabezado">
        <h1>{tarea.titulo}</h1>
        <div className="datos" style={{ alignItems: 'center' }}>
          <Etiqueta {...estado} />
          <span>Entrega: {formatearFecha(tarea.fechaEntrega)}</span>
          {tarea.puntos != null && <span>{tarea.puntos} puntos</span>}
        </div>
      </header>

      <div className="acciones">
        <button className="boton boton-primario" onClick={nuevoDocumento} disabled={creando}>
          {creando ? 'Creando…' : 'Crear documento para esta tarea'}
        </button>
        <a className="boton" href={tarea.enlace} target="_blank" rel="noreferrer">Abrir en Classroom</a>
      </div>
      {errorCrear && <div style={{ marginTop: '1rem' }}><MensajeError error={errorCrear} /></div>}

      {documentos.datos?.length > 0 && (
        <section className="seccion">
          <h2>Tus documentos para esta tarea</h2>
          <ul className="lista-documentos">
            {documentos.datos.map((doc) => (
              <li key={doc.id}>
                <Link to={`/documentos/${doc.id}`} className="lista-documentos-enlace">
                  <span className="lista-documentos-titulo">{doc.titulo}</span>
                  <span className="suave">Editado {haceCuanto(doc.actualizadoEn)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="seccion">
        <h2>Instrucciones</h2>
        {tarea.instrucciones
          ? <div className="instrucciones">{tarea.instrucciones}</div>
          : <p className="mensaje">Esta tarea no tiene instrucciones escritas.</p>}
      </section>

      {tarea.materiales.length > 0 && (
        <section className="seccion">
          <h2>Materiales</h2>
          <ul className="lista-simple">
            {tarea.materiales.map((m, i) => (
              <li key={i}>
                <a href={m.enlace} target="_blank" rel="noreferrer">{m.titulo || m.enlace}</a>
                <span className="suave"> · {TIPOS_MATERIAL[m.tipo]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
