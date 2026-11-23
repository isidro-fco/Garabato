import { Check, Eraser, Loader2 } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { guardarHorario } from '../api.js'
import { Label } from '@/componentes/ui/label'
import { Switch } from '@/componentes/ui/switch'
import { cn } from '@/lib/utils'
import {
  bloquesDesdeCeldas,
  celdasDesdeHorarios,
  claveCelda,
  coloresPorClase,
  DIAS,
  formatearHora,
  MINUTOS_CELDA,
  rangoTabla,
} from '../utils/horario.js'
import { MensajeError, Vacio } from './Estado.jsx'

const BORRADOR = 'borrador'

// Horario semanal que se pinta: eliges una materia abajo y arrastras sobre la
// tabla (en celular, tocas cada hora). Cada trazo se guarda solo.
// clases: materias activas. horarios: bloques guardados (de todas las materias).
// onGuardado(horarios) recibe el horario completo después de cada guardado.
export default function HorarioPintable({ clases, horarios, onGuardado }) {
  const ids = clases.map((c) => c.id)
  const colores = coloresPorClase(clases)
  const nombres = new Map(clases.map((c) => [c.id, c.nombre]))
  const deActivas = horarios.filter((h) => ids.includes(h.cursoId))

  const [celdas, setCeldas] = useState(() => celdasDesdeHorarios(deActivas))
  const [rango] = useState(() => rangoTabla(deActivas))
  const [conDomingo, setConDomingo] = useState(() => deActivas.some((h) => h.dia === 0))
  const [pincel, setPincel] = useState(clases[0]?.id ?? null)
  const [estado, setEstado] = useState(null) // null | 'guardando' | 'guardado' | 'error'
  const [error, setError] = useState(null)
  const idDomingo = useId()

  // Refs para leer el valor actual dentro de los eventos del puntero.
  const actuales = useRef(celdas)
  const trazo = useRef(null) // { modo: 'pintar' | 'borrar' } mientras se arrastra
  const tipoPuntero = useRef(null)
  const guardando = useRef(false)
  const pendiente = useRef(false)

  // Guarda la tabla; si llega otro trazo mientras guarda, vuelve a guardar al terminar.
  async function sincronizar() {
    if (guardando.current) {
      pendiente.current = true
      return
    }
    guardando.current = true
    setEstado('guardando')
    setError(null)
    try {
      let lista
      do {
        pendiente.current = false
        lista = await guardarHorario(ids, bloquesDesdeCeldas(actuales.current))
      } while (pendiente.current)
      setEstado('guardado')
      onGuardado?.(lista)
    } catch (err) {
      setEstado('error')
      setError(err)
    } finally {
      guardando.current = false
    }
  }

  function aplicar(clave, modo) {
    const actual = actuales.current.get(clave)
    if (modo === 'borrar' ? actual === undefined : actual === pincel) return
    const nuevas = new Map(actuales.current)
    if (modo === 'borrar') nuevas.delete(clave)
    else nuevas.set(clave, pincel)
    actuales.current = nuevas
    setCeldas(nuevas)
  }

  // Si la celda ya es de la materia elegida, el trazo borra; si no, pinta.
  const modoPara = (clave) => (pincel === BORRADOR || actuales.current.get(clave) === pincel ? 'borrar' : 'pintar')

  // El trazo termina al soltar el botón en cualquier parte de la página.
  useEffect(() => {
    function soltar() {
      if (!trazo.current) return
      trazo.current = null
      sincronizar()
    }
    window.addEventListener('pointerup', soltar)
    window.addEventListener('pointercancel', soltar)
    return () => {
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', soltar)
    }
  })

  if (clases.length === 0) return <Vacio>No tienes materias seleccionadas.</Vacio>

  const dias = DIAS.filter(([dia]) => dia !== 0 || conDomingo)
  const filas = []
  for (let m = rango.inicio; m < rango.fin; m += MINUTOS_CELDA) filas.push(m)
  const horasPorMateria = new Map()
  for (const cursoId of celdas.values()) horasPorMateria.set(cursoId, (horasPorMateria.get(cursoId) ?? 0) + MINUTOS_CELDA / 60)
  const colorPincel = pincel === BORRADOR ? 'var(--muted-foreground)' : colores.get(pincel)

  const celda = (dia, nombreDia, minuto) => {
    const clave = claveCelda(dia, minuto)
    const cursoId = celdas.get(clave)
    const color = cursoId ? colores.get(cursoId) : null
    const arriba = celdas.get(claveCelda(dia, minuto - MINUTOS_CELDA))
    const abajo = celdas.get(claveCelda(dia, minuto + MINUTOS_CELDA))
    const empieza = cursoId && arriba !== cursoId
    const termina = cursoId && abajo !== cursoId
    // Celdas seguidas de la misma materia desde aquí: la etiqueta ocupa todo el bloque.
    let largo = 0
    if (empieza) while (celdas.get(claveCelda(dia, minuto + largo * MINUTOS_CELDA)) === cursoId) largo++

    return (
      <button
        key={clave}
        type="button"
        aria-label={`${nombreDia} ${formatearHora(`${String(minuto / 60).padStart(2, '0')}:00`)}: ${cursoId ? nombres.get(cursoId) : 'libre'}`}
        className={cn(
          'group relative h-(--alto-celda) border-t border-l outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring',
          cursoId && !empieza && 'border-t-transparent',
        )}
        onPointerDown={(e) => {
          tipoPuntero.current = e.pointerType
          if (e.pointerType === 'touch' || e.button !== 0 || !pincel) return
          e.preventDefault() // sin selección de texto al arrastrar
          e.currentTarget.releasePointerCapture?.(e.pointerId) // la pluma captura el puntero; así cruza celdas
          trazo.current = { modo: modoPara(clave) }
          aplicar(clave, trazo.current.modo)
        }}
        onPointerEnter={() => trazo.current && aplicar(clave, trazo.current.modo)}
        onClick={(e) => {
          // Con mouse o pluma ya se aplicó en pointerdown; esto es para toque y teclado.
          // El click trae su pointerType ('' con teclado); si el navegador no lo da,
          // detail === 0 indica teclado y si no, se usa el del último pointerdown.
          const tipo = e.nativeEvent.pointerType ?? (e.detail === 0 ? '' : tipoPuntero.current)
          if (tipo === 'mouse' || tipo === 'pen' || !pincel) return
          aplicar(clave, modoPara(clave))
          sincronizar()
        }}
      >
        {cursoId ? (
          <>
            {/* -top-px: cubre la línea de la celda para que el bloque se vea continuo. */}
            <span
              className={cn('absolute inset-x-0.5 bottom-0', empieza ? 'top-0.5 rounded-t-md' : '-top-px', termina && 'bottom-0.5 rounded-b-md')}
              style={{ background: color }}
            />
            {empieza && (
              <span
                className="pointer-events-none absolute inset-x-0.5 top-0.5 z-10 overflow-hidden px-1 pt-0.5 text-left text-[10px] leading-tight font-medium break-words hyphens-auto text-white"
                style={{ height: `calc(${largo} * var(--alto-celda) - 0.25rem)` }}
              >
                {nombres.get(cursoId)}
              </span>
            )}
          </>
        ) : (
          // Vista previa del pincel al pasar el mouse.
          <span className="absolute inset-x-0.5 inset-y-0 rounded-sm opacity-0 group-hover:opacity-25" style={{ background: colorPincel }} />
        )}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
        <p className="text-muted-foreground">
          Elige una materia abajo y arrastra sobre la tabla para pintar sus horas. Pasa otra vez sobre ellas para borrarlas.
        </p>
        <div className="flex items-center gap-4">
          <EstadoGuardado estado={estado} />
          <div className="flex items-center gap-2">
            <Switch id={idDomingo} checked={conDomingo} onCheckedChange={setConDomingo} size="sm" />
            <Label htmlFor={idDomingo} className="font-normal">Domingo</Label>
          </div>
        </div>
      </div>

      {error && <MensajeError error={error} onReintentar={sincronizar} />}

      <div className="overflow-hidden rounded-xl border bg-card select-none">
        <div
          // Alto de cada hora: más alto en celular, donde los nombres ocupan más líneas.
          className="grid touch-manipulation [--alto-celda:2.75rem] md:[--alto-celda:2.25rem]"
          style={{ gridTemplateColumns: `2.75rem repeat(${dias.length}, minmax(0, 1fr))` }}
          role="group"
          aria-label="Tabla del horario"
        >
          <div className="border-b bg-muted/40" />
          {dias.map(([dia, nombre, corto]) => (
            <div key={dia} className="border-b border-l bg-muted/40 py-2 text-center text-xs font-medium">
              <span className="sm:hidden">{corto}</span>
              <span className="hidden sm:inline">{nombre}</span>
            </div>
          ))}
          {filas.map((minuto) => [
            <div key={`h${minuto}`} className="h-(--alto-celda) border-t pt-0.5 pr-1.5 text-right text-[10px] text-muted-foreground">
              {minuto / 60}:00
            </div>,
            ...dias.map(([dia, nombre]) => celda(dia, nombre, minuto)),
          ])}
        </div>
      </div>

      {/* Pinceles: fijos abajo para tenerlos a la mano mientras se pinta. */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-xl md:border">
        <p className="mb-2 text-xs text-muted-foreground" id={`${idDomingo}-pinceles`}>Materia para pintar</p>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-labelledby={`${idDomingo}-pinceles`}>
          {clases.map((clase) => (
            <Pincel
              key={clase.id}
              activo={pincel === clase.id}
              color={colores.get(clase.id)}
              onClick={() => setPincel(clase.id)}
            >
              <span className="truncate">{clase.nombre}</span>
              {horasPorMateria.get(clase.id) > 0 && (
                <span className="shrink-0 text-xs text-muted-foreground">{horasPorMateria.get(clase.id).toLocaleString('es-MX')} h</span>
              )}
            </Pincel>
          ))}
          <Pincel activo={pincel === BORRADOR} onClick={() => setPincel(BORRADOR)}>
            <Eraser className="size-3.5" aria-hidden="true" />Borrar
          </Pincel>
        </div>
      </div>
    </div>
  )
}

function Pincel({ activo, color, onClick, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={activo}
      onClick={onClick}
      className={cn(
        'flex max-w-full min-w-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
        activo && 'border-foreground bg-muted font-medium',
      )}
      style={activo && color ? { borderColor: color, boxShadow: `inset 0 0 0 1px ${color}` } : undefined}
    >
      {color && <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />}
      {children}
    </button>
  )
}

function EstadoGuardado({ estado }) {
  if (!estado || estado === 'error') return null
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground" aria-live="polite">
      {estado === 'guardando' ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
      {estado === 'guardando' ? 'Guardando…' : 'Guardado'}
    </span>
  )
}
