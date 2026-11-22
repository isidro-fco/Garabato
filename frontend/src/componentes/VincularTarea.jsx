import { useState } from 'react'
import { Link } from 'react-router-dom'
import { listarClases, listarTareas, obtenerTarea } from '../api.js'
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
      <button className="boton boton-chico" onClick={() => setEditando(true)}>
        Vincular a una tarea
      </button>
    )
  }

  const tarea = vinculada.datos
  return (
    <div className="vinculo">
      <span className="suave">Tarea:</span>{' '}
      {vinculada.cargando && <span className="suave">cargando…</span>}
      {vinculada.error && <span className="suave">no disponible</span>}
      {tarea && (
        <Link to={`/clases/${cursoId}/tareas/${tareaId}`}>
          {tarea.titulo} <span className="suave">· {tarea.curso}</span>
        </Link>
      )}
      <button className="boton-texto" onClick={() => setEditando(true)}>Cambiar</button>
      <button className="boton-texto" onClick={() => onCambiar({ cursoId: null, tareaId: null })}>Quitar</button>
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
      className="vinculo"
      onSubmit={(e) => {
        e.preventDefault()
        if (curso && tarea) onElegir(curso, tarea)
      }}
    >
      <label className="sr-only" htmlFor="vinculo-clase">Clase</label>
      <select
        id="vinculo-clase"
        value={curso}
        onChange={(e) => {
          setCurso(e.target.value)
          setTarea('')
        }}
        disabled={clases.cargando}
      >
        <option value="">{clases.cargando ? 'Cargando clases…' : 'Elige una clase'}</option>
        {clases.datos?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
      </select>

      <label className="sr-only" htmlFor="vinculo-tarea">Tarea</label>
      <select
        id="vinculo-tarea"
        value={tarea}
        onChange={(e) => setTarea(e.target.value)}
        disabled={!curso || tareas.cargando}
      >
        <option value="">{curso && tareas.cargando ? 'Cargando tareas…' : 'Elige una tarea'}</option>
        {tareas.datos?.map((t) => <option key={t.id} value={t.id}>{t.titulo}</option>)}
      </select>

      <button className="boton boton-chico boton-primario" type="submit" disabled={!curso || !tarea}>Vincular</button>
      <button className="boton-texto" type="button" onClick={onCancelar}>Cancelar</button>
      {(clases.error || tareas.error) && <span className="texto-error">No se pudo cargar Classroom.</span>}
    </form>
  )
}
