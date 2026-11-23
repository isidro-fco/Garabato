import { Link, useOutletContext } from 'react-router-dom'
import { listarClases } from '../api.js'
import { Cargando, Encabezado, MensajeError, Vacio } from '../componentes/Estado.jsx'
import { Card, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { soloActivas } from '../utils/materias.js'
import { useCargar } from '../utils/useCargar.js'

export default function Clases() {
  const { materias } = useOutletContext()
  const { cargando, datos: todas, error } = useCargar(listarClases, [])
  const clases = todas && soloActivas(todas, materias)
  const ocultas = todas ? todas.length - clases.length : 0

  return (
    <>
      <Encabezado titulo="Clases" descripcion="Las materias que elegiste de Google Classroom.">
        {ocultas > 0 && (
          <p className="text-sm text-muted-foreground">
            {ocultas} {ocultas === 1 ? 'materia oculta' : 'materias ocultas'} ·{' '}
            <Link to="/configuracion" className="font-medium text-foreground underline-offset-4 hover:underline">Cambiar</Link>
          </p>
        )}
      </Encabezado>

      {cargando && <Cargando texto="Cargando tus clases…" />}
      {error && <MensajeError error={error} />}
      {todas?.length === 0 && <Vacio>No tienes clases activas en Classroom.</Vacio>}
      {todas?.length > 0 && clases.length === 0 && (
        <Vacio>
          No tienes materias seleccionadas.{' '}
          <Link to="/configuracion" className="font-medium text-foreground underline underline-offset-4">Escógelas en Configuración</Link>.
        </Vacio>
      )}

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
