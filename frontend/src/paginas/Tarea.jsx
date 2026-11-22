import { ExternalLink, FilePlus2, FileText, FileVideo, Link2, ListChecks, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { crearDocumento, listarDocumentos, obtenerTarea } from '../api.js'
import { Cargando, Encabezado, Etiqueta, MensajeError, Migas } from '../componentes/Estado.jsx'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card'
import { haceCuanto } from '../utils/fechas.js'
import { estadoTarea, formatearFecha } from '../utils/tareas.js'
import { useCargar } from '../utils/useCargar.js'

const MATERIALES = {
  drive: ['Drive', FileText],
  enlace: ['Enlace', Link2],
  youtube: ['YouTube', FileVideo],
  formulario: ['Formulario', ListChecks],
}

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
      <Migas items={[['Clases', '/clases'], [tarea.curso ?? 'Clase', `/clases/${cursoId}`], [tarea.titulo]]} />
      <Encabezado titulo={tarea.titulo}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-sm text-muted-foreground">
          <Etiqueta {...estado} />
          <span>Entrega: {formatearFecha(tarea.fechaEntrega)}</span>
          {tarea.puntos != null && <span>{tarea.puntos} puntos</span>}
        </div>
      </Encabezado>

      <div className="flex flex-wrap gap-2">
        <Button onClick={nuevoDocumento} disabled={creando}>
          {creando ? <Loader2 className="animate-spin" /> : <FilePlus2 />}
          {creando ? 'Creando…' : 'Crear documento para esta tarea'}
        </Button>
        <Button asChild variant="outline">
          <a href={tarea.enlace} target="_blank" rel="noreferrer"><ExternalLink />Abrir en Classroom</a>
        </Button>
      </div>
      {errorCrear && <MensajeError error={errorCrear} className="mt-4" />}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader><CardTitle>Instrucciones</CardTitle></CardHeader>
          <CardContent className="text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
            {tarea.instrucciones || <span className="text-muted-foreground">Esta tarea no tiene instrucciones escritas.</span>}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {documentos.datos?.length > 0 && (
            <Card size="sm">
              <CardHeader><CardTitle>Tus documentos para esta tarea</CardTitle></CardHeader>
              <CardContent>
                <ul className="-mx-2 space-y-0.5">
                  {documentos.datos.map((doc) => (
                    <li key={doc.id}>
                      <Link to={`/documentos/${doc.id}`} className="flex flex-col rounded-md px-2 py-1.5 hover:bg-muted">
                        <span className="truncate text-sm font-medium">{doc.titulo}</span>
                        <span className="text-xs text-muted-foreground">Editado {haceCuanto(doc.actualizadoEn)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {tarea.materiales.length > 0 && (
            <Card size="sm">
              <CardHeader><CardTitle>Materiales</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tarea.materiales.map((m, i) => {
                    const [tipo, Icono] = MATERIALES[m.tipo] ?? ['Material', Link2]
                    return (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Icono className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="min-w-0">
                          <a href={m.enlace} target="_blank" rel="noreferrer" className="break-words underline-offset-4 hover:underline">{m.titulo || m.enlace}</a>
                          <span className="text-muted-foreground"> · {tipo}</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
