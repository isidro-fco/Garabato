import { Link, useParams } from 'react-router-dom'
import { listarTareas, obtenerClase } from '../api.js'
import { Cargando, MensajeError } from '../componentes/Estado.jsx'
import MosaicoTarea from '../componentes/MosaicoTarea.jsx'
import { useCargar } from '../utils/useCargar.js'

export default function Materia() {
  const { cursoId } = useParams()
  const clase = useCargar(() => obtenerClase(cursoId), [cursoId])
  const tareas = useCargar(() => listarTareas(cursoId), [cursoId])

  if (clase.cargando) return <Cargando texto="Cargando la clase…" />
  if (clase.error) return <MensajeError error={clase.error} />

  const { nombre, seccion, salon, descripcion, maestros, enlace } = clase.datos
  const porEntregar = tareas.datos?.filter((t) => !t.entregada) ?? []
  const entregadas = tareas.datos?.filter((t) => t.entregada) ?? []

  return (
    <>
      <nav className="migas" aria-label="Ruta">
        <Link to="/clases">Clases</Link>
        <span aria-hidden="true">/</span>
        <span>{nombre}</span>
      </nav>

      <header className="encabezado">
        <h1>{nombre}</h1>
        <div className="datos">
          {seccion && <span>{seccion}</span>}
          {salon && <span>Salón {salon}</span>}
          {maestros.length > 0 && (
            <span>
              {maestros.length === 1 ? 'Maestro' : 'Maestros'}: {maestros.map((m) => m.nombre).join(', ')}
            </span>
          )}
        </div>
        {descripcion && <p style={{ margin: '0.25rem 0 0' }}>{descripcion}</p>}
        <div className="acciones" style={{ marginTop: '0.5rem' }}>
          <a className="boton" href={enlace} target="_blank" rel="noreferrer">Abrir en Classroom</a>
        </div>
      </header>

      {tareas.cargando && <Cargando texto="Cargando las tareas…" />}
      {tareas.error && <MensajeError error={tareas.error} />}
      {tareas.datos?.length === 0 && <p className="mensaje">Esta clase todavía no tiene tareas.</p>}

      {porEntregar.length > 0 && (
        <section className="seccion">
          <h2>Por entregar ({porEntregar.length})</h2>
          <div className="rejilla">
            {porEntregar.map((t) => <MosaicoTarea key={t.id} tarea={t} />)}
          </div>
        </section>
      )}

      {entregadas.length > 0 && (
        <section className="seccion">
          <h2>Entregadas ({entregadas.length})</h2>
          <div className="rejilla">
            {entregadas.map((t) => <MosaicoTarea key={t.id} tarea={t} />)}
          </div>
        </section>
      )}
    </>
  )
}
