import { Link, useParams } from 'react-router-dom'
import { obtenerTarea } from '../api.js'
import { Cargando, Etiqueta, MensajeError } from '../componentes/Estado.jsx'
import { estadoTarea, formatearFecha } from '../utils/tareas.js'
import { useCargar } from '../utils/useCargar.js'

const TIPOS_MATERIAL = { drive: 'Drive', enlace: 'Enlace', youtube: 'YouTube', formulario: 'Formulario' }

// Vista de instrucciones de una tarea.
export default function Tarea() {
  const { cursoId, tareaId } = useParams()
  const { cargando, datos: tarea, error } = useCargar(() => obtenerTarea(cursoId, tareaId), [cursoId, tareaId])

  if (cargando) return <Cargando texto="Cargando la tarea…" />
  if (error) return <MensajeError error={error} />

  const estado = estadoTarea(tarea)
  const nuevoDocumento = `/documentos/nuevo?${new URLSearchParams({ curso: cursoId, tarea: tareaId })}`

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
        <Link className="boton boton-primario" to={nuevoDocumento}>Crear documento para esta tarea</Link>
        <a className="boton" href={tarea.enlace} target="_blank" rel="noreferrer">Abrir en Classroom</a>
      </div>

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
