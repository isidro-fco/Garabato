import { Link2, Unlink } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { listarClases, listarTareas, obtenerTarea } from '../api.js'
import { Button } from '@/componentes/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select'
import { useCargar } from '../utils/useCargar.js'

const nada = () => Promise.resolve(null)

// Muestra a qué tarea está vinculado el documento y permite cambiarla o quitarla.
export default function VincularTarea({ cursoId, tareaId, onCambiar }) {
  const [editando, setEditando] = useState(false)
  const vinculada = useCargar(
    () => (cursoId && tareaId ? obtenerTarea(cursoId, tareaId) : nada()),
    [cursoId, tareaId],
  )

  if (editando) {
    return (
      <SelectorTarea
        cursoInicial={cursoId}
        onElegir={(curso, tarea) => {
          onCambiar({ cursoId: curso, tareaId: tarea })
          setEditando(false)
        }}
        onCancelar={() => setEditando(false)}
      />
    )
  }

  if (!cursoId || !tareaId) {
    return (
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => setEditando(true)}>
          <Link2 />Vincular a una tarea
        </Button>
      </div>
    )
  }

  const tarea = vinculada.datos
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
      <Link2 className="size-4 text-muted-foreground" aria-hidden="true" />
      <span className="text-muted-foreground">Tarea:</span>
      {vinculada.cargando && <span className="text-muted-foreground">cargando…</span>}
      {vinculada.error && <span className="text-muted-foreground">no disponible</span>}
      {tarea && (
        <Link to={`/clases/${cursoId}/tareas/${tareaId}`} className="font-medium underline-offset-4 hover:underline">
          {tarea.titulo} <span className="font-normal text-muted-foreground">· {tarea.curso}</span>
        </Link>
      )}
      <Button variant="link" size="sm" className="h-auto px-1.5" onClick={() => setEditando(true)}>Cambiar</Button>
      <Button variant="link" size="sm" className="h-auto px-1.5 text-muted-foreground" onClick={() => onCambiar({ cursoId: null, tareaId: null })}>
        <Unlink />Quitar
      </Button>
    </div>
  )
}

function SelectorTarea({ cursoInicial, onElegir, onCancelar }) {
  const [curso, setCurso] = useState(cursoInicial ?? '')
  const [tarea, setTarea] = useState('')
  const clases = useCargar(listarClases, [])
  const tareas = useCargar(() => (curso ? listarTareas(curso) : nada()), [curso])

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (curso && tarea) onElegir(curso, tarea)
      }}
    >
      <Select value={curso} onValueChange={(valor) => { setCurso(valor); setTarea('') }} disabled={clases.cargando}>
        <SelectTrigger size="sm" className="w-52" aria-label="Clase">
          <SelectValue placeholder={clases.cargando ? 'Cargando clases…' : 'Elige una clase'} />
        </SelectTrigger>
        <SelectContent>
          {clases.datos?.map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={tarea} onValueChange={setTarea} disabled={!curso || tareas.cargando}>
        <SelectTrigger size="sm" className="w-60" aria-label="Tarea">
          <SelectValue placeholder={curso && tareas.cargando ? 'Cargando tareas…' : 'Elige una tarea'} />
        </SelectTrigger>
        <SelectContent>
          {tareas.datos?.map((t) => <SelectItem key={t.id} value={t.id}>{t.titulo}</SelectItem>)}
        </SelectContent>
      </Select>

      <Button type="submit" size="sm" disabled={!curso || !tarea}>Vincular</Button>
      <Button type="button" size="sm" variant="ghost" onClick={onCancelar}>Cancelar</Button>
      {(clases.error || tareas.error) && <span className="text-sm text-destructive">No se pudo cargar Classroom.</span>}
    </form>
  )
}
