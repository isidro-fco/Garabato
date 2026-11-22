import { Link } from 'react-router-dom'
import { estadoTarea, formatearFecha } from '../utils/tareas.js'
import { Etiqueta } from './Estado.jsx'

export default function MosaicoTarea({ tarea }) {
  const estado = estadoTarea(tarea)

  return (
    <Link to={`/clases/${tarea.cursoId}/tareas/${tarea.id}`} className="tarjeta">
      <h3>{tarea.titulo}</h3>
      {tarea.instrucciones && (
        <p className="suave" style={{ margin: 0, fontSize: '0.9rem' }}>
          {recortar(tarea.instrucciones, 110)}
        </p>
      )}
      <div className="tarjeta-pie">
        <span className="suave">{formatearFecha(tarea.fechaEntrega)}</span>
        <Etiqueta {...estado} />
      </div>
    </Link>
  )
}

function recortar(texto, max) {
  const limpio = texto.replace(/\s+/g, ' ').trim()
  return limpio.length > max ? `${limpio.slice(0, max).trimEnd()}…` : limpio
}
