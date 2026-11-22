import { CalendarClock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/componentes/ui/card'
import { estadoTarea, formatearFecha } from '../utils/tareas.js'
import { Etiqueta } from './Estado.jsx'

export default function MosaicoTarea({ tarea }) {
  const estado = estadoTarea(tarea)

  return (
    <Link to={`/clases/${tarea.cursoId}/tareas/${tarea.id}`} className="group rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
      <Card className="h-full gap-3 transition-colors group-hover:ring-foreground/25">
        <CardHeader>
          <CardTitle className="leading-snug">{tarea.titulo}</CardTitle>
        </CardHeader>
        {tarea.instrucciones && (
          <CardContent className="line-clamp-3 text-sm text-muted-foreground">
            {tarea.instrucciones.replace(/\s+/g, ' ')}
          </CardContent>
        )}
        <CardFooter className="mt-auto justify-between gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarClock className="size-3.5" aria-hidden="true" />
            {formatearFecha(tarea.fechaEntrega)}
          </span>
          <Etiqueta {...estado} />
        </CardFooter>
      </Card>
    </Link>
  )
}
