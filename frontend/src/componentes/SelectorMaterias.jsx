import { Loader2 } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '@/componentes/ui/button'
import { Checkbox } from '@/componentes/ui/checkbox'
import { cn } from '@/lib/utils'
import { MensajeError } from './Estado.jsx'

// Lista de clases de Classroom con una casilla cada una.
// inicial: ids marcados al abrir (null = todas). onGuardar(ids) guarda la selección.
// Se usa en la bienvenida (primer acceso) y en Configuración.
export default function SelectorMaterias({ clases, inicial, onGuardar, textoGuardar = 'Guardar', soloSiCambia = false }) {
  const id = useId()
  const deInicio = inicial ? clases.filter((c) => inicial.includes(c.id)).map((c) => c.id) : clases.map((c) => c.id)
  const [elegidas, setElegidas] = useState(() => new Set(deInicio))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [guardado, setGuardado] = useState(false)

  const cambio = elegidas.size !== deInicio.length || deInicio.some((c) => !elegidas.has(c))
  const elegir = (nuevas) => {
    setElegidas(nuevas)
    setGuardado(false)
  }
  const alternar = (cursoId, marcada) =>
    elegir((actual) => {
      const nuevas = new Set(actual)
      if (marcada) nuevas.add(cursoId)
      else nuevas.delete(cursoId)
      return nuevas
    })

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      // En el orden de Classroom, no en el que se marcaron.
      await onGuardar(clases.filter((c) => elegidas.has(c.id)).map((c) => c.id))
      setGuardado(true)
    } catch (err) {
      setError(err)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {elegidas.size} de {clases.length} {clases.length === 1 ? 'materia' : 'materias'}
        </p>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="xs" onClick={() => elegir(new Set(clases.map((c) => c.id)))}>Todas</Button>
          <Button type="button" variant="ghost" size="xs" onClick={() => elegir(new Set())}>Ninguna</Button>
        </div>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {clases.map((clase) => {
          const marcada = elegidas.has(clase.id)
          const casilla = `${id}-${clase.id}`
          return (
            <li key={clase.id}>
              <label
                htmlFor={casilla}
                className={cn(
                  'flex h-full cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50',
                  marcada && 'border-foreground/30 bg-muted/40',
                )}
              >
                <Checkbox id={casilla} checked={marcada} onCheckedChange={(v) => alternar(clase.id, v === true)} className="mt-0.5" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-snug">{clase.nombre}</span>
                  {clase.seccion && <span className="block text-xs text-muted-foreground">{clase.seccion}</span>}
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      {error && <MensajeError error={error} onReintentar={null} />}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={guardando || elegidas.size === 0 || (soloSiCambia && !cambio)}>
          {guardando && <Loader2 className="animate-spin" />}
          {guardando ? 'Guardando…' : textoGuardar}
        </Button>
        {elegidas.size === 0 && <span className="text-xs text-muted-foreground">Elige al menos una materia.</span>}
        {soloSiCambia && guardado && !cambio && <span className="text-sm text-muted-foreground" aria-live="polite">Materias guardadas.</span>}
      </div>
    </form>
  )
}
