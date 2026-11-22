import { Link } from 'react-router-dom'
import { listarClases } from '../api.js'
import { Cargando, Encabezado, MensajeError, Vacio } from '../componentes/Estado.jsx'
import { Card, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { useCargar } from '../utils/useCargar.js'

export default function Clases() {
  const { cargando, datos: clases, error } = useCargar(listarClases, [])

  return (
    <>
      <Encabezado titulo="Clases" descripcion="Tus materias activas en Google Classroom." />

      {cargando && <Cargando texto="Cargando tus clases…" />}
      {error && <MensajeError error={error} />}
      {clases?.length === 0 && <Vacio>No tienes clases activas en Classroom.</Vacio>}

      {clases?.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clases.map((clase) => (
            <Link key={clase.id} to={`/clases/${clase.id}`} className="group rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
              <Card className="h-full transition-colors group-hover:ring-foreground/25">
                <CardHeader>
                  <CardTitle>{clase.nombre}</CardTitle>
                  {(clase.seccion || clase.salon) && (
                    <CardDescription>
                      {[clase.seccion, clase.salon && `Salón ${clase.salon}`].filter(Boolean).join(' · ')}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
