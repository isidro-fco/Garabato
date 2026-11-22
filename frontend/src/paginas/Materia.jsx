import { ExternalLink } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { listarTareas, obtenerClase } from '../api.js'
import { Cargando, Encabezado, MensajeError, Migas, Vacio } from '../componentes/Estado.jsx'
import MosaicoTarea from '../componentes/MosaicoTarea.jsx'
import { Button } from '@/componentes/ui/button'
import { useCargar } from '../utils/useCargar.js'

function SeccionTareas({ titulo, tareas }) {
  if (tareas.length === 0) return null
  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-base font-semibold">{titulo} <span className="font-normal text-muted-foreground">({tareas.length})</span></h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tareas.map((t) => <MosaicoTarea key={t.id} tarea={t} />)}
      </div>
    </section>
  )
}

export default function Materia() {
  const { cursoId } = useParams()
  const clase = useCargar(() => obtenerClase(cursoId), [cursoId])
  const tareas = useCargar(() => listarTareas(cursoId), [cursoId])

  if (clase.cargando) return <Cargando texto="Cargando la clase…" />
  if (clase.error) return <MensajeError error={clase.error} />

  const { nombre, seccion, salon, descripcion, maestros, enlace } = clase.datos
  const datos = [
    seccion,
    salon && `Salón ${salon}`,
    maestros.length > 0 && `${maestros.length === 1 ? 'Maestro' : 'Maestros'}: ${maestros.map((m) => m.nombre).join(', ')}`,
  ].filter(Boolean)

  return (
    <>
      <Migas items={[['Clases', '/clases'], [nombre]]} />
      <Encabezado
        titulo={nombre}
        descripcion={datos.join(' · ')}
        accion={(
          <Button asChild variant="outline">
            <a href={enlace} target="_blank" rel="noreferrer"><ExternalLink />Abrir en Classroom</a>
          </Button>
        )}
      >
        {descripcion && <p className="pt-1 text-sm">{descripcion}</p>}
      </Encabezado>

      {tareas.cargando && <Cargando texto="Cargando las tareas…" />}
      {tareas.error && <MensajeError error={tareas.error} />}
      {tareas.datos?.length === 0 && <Vacio>Esta clase todavía no tiene tareas.</Vacio>}

      {tareas.datos && (
        <>
          <SeccionTareas titulo="Por entregar" tareas={tareas.datos.filter((t) => !t.entregada)} />
          <SeccionTareas titulo="Entregadas" tareas={tareas.datos.filter((t) => t.entregada)} />
        </>
      )}
    </>
  )
}
