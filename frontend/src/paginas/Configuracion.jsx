import { Clock, Loader2, Plus, X } from 'lucide-react'
import { useId, useState } from 'react'
import { crearHorario, eliminarHorario, listarClases, listarHorarios } from '../api.js'
import { Cargando, Encabezado, MensajeError, Vacio } from '../componentes/Estado.jsx'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { coloresPorClase, DIAS, formatearHora, nombreDia, posicionDia, seEnciman } from '../utils/horario.js'
import { useCargar } from '../utils/useCargar.js'

const cargarTodo = () => Promise.all([listarClases(), listarHorarios()])

export default function Configuracion() {
  const { cargando, datos, error } = useCargar(cargarTodo, [])

  return (
    <>
      <Encabezado titulo="Configuración" descripcion="Captura a qué hora tienes cada materia para verla en tu horario semanal." />
      {cargando && <Cargando texto="Cargando tus clases…" />}
      {error && <MensajeError error={error} />}
      {datos && <EditorHorario clases={datos[0]} inicial={datos[1]} />}
    </>
  )
}

const ordenar = (lista) =>
  [...lista].sort((a, b) => posicionDia(a.dia) - posicionDia(b.dia) || a.horaInicio.localeCompare(b.horaInicio))

function EditorHorario({ clases, inicial }) {
  const [horarios, setHorarios] = useState(inicial)
  const [errorAccion, setErrorAccion] = useState(null)
  const colores = coloresPorClase(clases)

  if (clases.length === 0) return <Vacio>No tienes clases activas en Classroom.</Vacio>

  async function agregar(nuevos) {
    setErrorAccion(null)
    // Un bloque por día; si alguno falla, se conservan los que sí se guardaron.
    const resultados = await Promise.allSettled(nuevos.map(crearHorario))
    const creados = resultados.filter((r) => r.status === 'fulfilled').map((r) => r.value)
    setHorarios((actuales) => [...actuales, ...creados])
    const fallo = resultados.find((r) => r.status === 'rejected')
    if (fallo) {
      setErrorAccion(fallo.reason)
      return false
    }
    return true
  }

  async function quitar(horario) {
    setErrorAccion(null)
    setHorarios((actuales) => actuales.filter((h) => h.id !== horario.id))
    try {
      await eliminarHorario(horario.id)
    } catch (err) {
      setHorarios((actuales) => [...actuales, horario])
      setErrorAccion(err)
    }
  }

  return (
    <div className="space-y-3">
      {errorAccion && <MensajeError error={errorAccion} onReintentar={null} />}
      {clases.map((clase) => (
        <HorarioClase
          key={clase.id}
          clase={clase}
          color={colores.get(clase.id)}
          bloques={ordenar(horarios.filter((h) => h.cursoId === clase.id))}
          todos={horarios}
          nombres={new Map(clases.map((c) => [c.id, c.nombre]))}
          onAgregar={agregar}
          onQuitar={quitar}
        />
      ))}
    </div>
  )
}

function HorarioClase({ clase, color, bloques, todos, nombres, onAgregar, onQuitar }) {
  const [agregando, setAgregando] = useState(false)

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
          {clase.nombre}
        </CardTitle>
        {clase.seccion && <CardDescription>{clase.seccion}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">
        {bloques.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {bloques.map((h) => (
              <li key={h.id} className="flex items-center gap-1.5 rounded-md border bg-muted/40 py-1 pr-1 pl-2.5 text-sm">
                <Clock className="size-3.5 text-muted-foreground" aria-hidden="true" />
                <span>
                  <span className="font-medium">{nombreDia(h.dia)}</span>{' '}
                  {formatearHora(h.horaInicio)} – {formatearHora(h.horaFin)}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onQuitar(h)}
                  aria-label={`Quitar ${nombreDia(h.dia)} ${h.horaInicio}`}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          !agregando && <p className="text-sm text-muted-foreground">Sin horario.</p>
        )}

        {agregando ? (
          <FormularioBloque
            cursoId={clase.id}
            todos={todos}
            nombres={nombres}
            onGuardar={async (nuevos) => {
              if (await onAgregar(nuevos)) setAgregando(false)
            }}
            onCancelar={() => setAgregando(false)}
          />
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAgregando(true)}>
            <Plus />Agregar horario
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function FormularioBloque({ cursoId, todos, nombres, onGuardar, onCancelar }) {
  const id = useId()
  const [dias, setDias] = useState([])
  const [horaInicio, setHoraInicio] = useState('07:00')
  const [horaFin, setHoraFin] = useState('08:00')
  const [guardando, setGuardando] = useState(false)

  const nuevos = dias.map((dia) => ({ cursoId, dia, horaInicio, horaFin }))
  const horasValidas = horaInicio && horaFin && horaFin > horaInicio
  // Aviso, no error: puede haber clases que se enciman a propósito (por ejemplo, optativas).
  const choques = nuevos.flatMap((n) => todos.filter((h) => seEnciman(n, h)).map((h) => `${nombres.get(h.cursoId) ?? 'otra clase'} (${nombreDia(h.dia)})`))

  return (
    <form
      className="space-y-3 rounded-lg border p-3"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!horasValidas || dias.length === 0) return
        setGuardando(true)
        await onGuardar(nuevos)
        setGuardando(false)
      }}
    >
      <fieldset className="space-y-1.5">
        <legend className="mb-1.5 text-xs text-muted-foreground">Días</legend>
        <div className="flex flex-wrap gap-1.5">
          {DIAS.map(([dia, nombre, corto]) => {
            const activo = dias.includes(dia)
            return (
              <Button
                key={dia}
                type="button"
                size="sm"
                variant={activo ? 'default' : 'outline'}
                className="min-w-12"
                aria-pressed={activo}
                aria-label={nombre}
                onClick={() => setDias((d) => (activo ? d.filter((x) => x !== dia) : [...d, dia]))}
              >
                {corto}
              </Button>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-inicio`} className="text-xs font-normal text-muted-foreground">Inicio</Label>
          <Input id={`${id}-inicio`} type="time" step={300} required value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="w-32" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-fin`} className="text-xs font-normal text-muted-foreground">Fin</Label>
          <Input
            id={`${id}-fin`}
            type="time"
            step={300}
            required
            value={horaFin}
            onChange={(e) => setHoraFin(e.target.value)}
            aria-invalid={!horasValidas}
            className="w-32"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={guardando || !horasValidas || dias.length === 0}>
            {guardando && <Loader2 className="animate-spin" />}
            {guardando ? 'Guardando…' : 'Guardar'}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancelar}>Cancelar</Button>
        </div>
      </div>

      {!horasValidas && <p className="text-xs text-destructive">La hora de fin debe ser después de la de inicio.</p>}
      {horasValidas && choques.length > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Se cruza con {[...new Set(choques)].join(', ')}.
        </p>
      )}
    </form>
  )
}
