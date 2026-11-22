import { Link } from 'react-router-dom'
import { listarClases } from '../api.js'
import { Cargando, MensajeError } from '../componentes/Estado.jsx'
import { useCargar } from '../utils/useCargar.js'

export default function Clases() {
  const { cargando, datos: clases, error } = useCargar(listarClases, [])

  return (
    <>
      <header className="encabezado">
        <h1>Clases</h1>
        <p className="suave" style={{ margin: 0 }}>Tus materias activas en Google Classroom.</p>
      </header>

      {cargando && <Cargando texto="Cargando tus clases…" />}
      {error && <MensajeError error={error} />}
      {clases?.length === 0 && <p className="mensaje">No tienes clases activas en Classroom.</p>}

      {clases?.length > 0 && (
        <div className="rejilla">
          {clases.map((clase) => (
            <Link key={clase.id} to={`/clases/${clase.id}`} className="tarjeta">
              <h2>{clase.nombre}</h2>
              {clase.seccion && <span className="suave">{clase.seccion}</span>}
              {clase.salon && <span className="suave" style={{ fontSize: '0.85rem' }}>Salón {clase.salon}</span>}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
