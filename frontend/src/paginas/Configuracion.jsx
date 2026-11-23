import { BookOpen, CalendarClock, ChevronRight, Palette, SunMoon } from 'lucide-react'
import { useRef, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { listarClases, listarHorarios } from '../api.js'
import ColoresMarkdown from '../componentes/ColoresMarkdown.jsx'
import { Cargando, Encabezado, MensajeError, Vacio } from '../componentes/Estado.jsx'
import HorarioPintable from '../componentes/HorarioPintable.jsx'
import SelectorMaterias from '../componentes/SelectorMaterias.jsx'
import SelectorTema from '../componentes/SelectorTema.jsx'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/componentes/ui/dialog'
import { cn } from '@/lib/utils'
import { ELEMENTOS, hayElegidos } from '../utils/coloresMarkdown.js'
import { celdasDesdeHorarios } from '../utils/horario.js'
import { soloActivas } from '../utils/materias.js'
import { NOMBRES_TEMA, useTema } from '../utils/tema.js'
import { useCargar } from '../utils/useCargar.js'

const cargarTodo = () => Promise.all([listarClases(), listarHorarios()])

// Configuración como un menú: cada opción es una tarjeta con un resumen y se
// abre en una ventana flotante. La ventana abierta va en la URL (?abrir=…), así
// el botón "atrás" del celular la cierra.
export default function Configuracion() {
  const { materias, cambiarMaterias, colores } = useOutletContext()
  const { cargando, datos, error } = useCargar(cargarTodo, [])
  const [params, setParams] = useSearchParams()
  const abierta = params.get('abrir')
  // Si la abrió el usuario, cerrar = regresar en el historial (como "atrás");
  // si se entró con el enlace directo, solo se quita ?abrir.
  const abiertaAqui = useRef(false)
  const abrir = (nombre) => {
    abiertaAqui.current = true
    setParams({ abrir: nombre })
  }
  const cerrar = () => {
    if (abiertaAqui.current) window.history.back()
    else setParams({}, { replace: true })
    abiertaAqui.current = false
  }

  const activas = datos && soloActivas(datos[0], materias)
  // El horario se guarda en cada trazo; aquí se conserva la versión más reciente.
  const [editado, setEditado] = useState(null)
  const horarios = editado ?? datos?.[1]

  const idsActivas = new Set(activas?.map((c) => c.id))
  const horas = horarios ? celdasDesdeHorarios(horarios.filter((h) => idsActivas.has(h.cursoId))).size : 0
  const conHorario = new Set(horarios?.filter((h) => idsActivas.has(h.cursoId)).map((h) => h.cursoId)).size
  const { tema, oscuro } = useTema()
  const personalizados = Object.values(colores ?? {}).filter(Boolean).length

  const OPCIONES = [
    {
      clave: 'materias',
      titulo: 'Materias',
      descripcion: 'Solo las materias marcadas aparecen en tus clases, tu calendario y tu horario.',
      icono: BookOpen,
      resumen: !datos ? null : datos[0].length === 0 ? 'Sin clases en Classroom' : `${activas.length} de ${datos[0].length} materias activas`,
      ancho: 'sm:max-w-2xl',
      contenido: datos && (datos[0].length === 0
        ? <Vacio>No tienes clases activas en Classroom.</Vacio>
        : <SelectorMaterias clases={datos[0]} inicial={materias} onGuardar={cambiarMaterias} textoGuardar="Guardar materias" soloSiCambia={materias !== null} />),
    },
    {
      clave: 'horario',
      titulo: 'Horario',
      descripcion: 'Tu tabla semanal de clases, pintada por horas.',
      icono: CalendarClock,
      resumen: !datos ? null : horas === 0 ? 'Sin horas pintadas' : `${horas} h por semana · ${conHorario} ${conHorario === 1 ? 'materia' : 'materias'}`,
      ancho: 'sm:max-w-5xl',
      // key: si cambian las materias, la tabla se arma de nuevo con ellas.
      contenido: datos && <HorarioPintable key={activas.map((c) => c.id).join()} clases={activas} horarios={horarios} onGuardado={setEditado} />,
    },
    {
      clave: 'colores',
      titulo: 'Colores del editor',
      descripcion: 'El color de cada elemento de Markdown mientras escribes y en el PDF.',
      icono: Palette,
      resumen: hayElegidos(colores) ? `${personalizados} ${personalizados === 1 ? 'color personalizado' : 'colores personalizados'}` : 'Paleta predeterminada',
      muestra: true,
      ancho: 'sm:max-w-5xl',
      contenido: <ColoresMarkdown />,
      sinDatos: true,
    },
    {
      clave: 'tema',
      titulo: 'Tema',
      descripcion: 'Claro, oscuro o el mismo de tu dispositivo.',
      icono: SunMoon,
      resumen: tema === 'sistema' ? `Sistema (ahora ${oscuro ? 'oscuro' : 'claro'})` : NOMBRES_TEMA[tema],
      ancho: 'sm:max-w-2xl',
      contenido: (
        <div className="space-y-3">
          <SelectorTema />
          <p className="text-xs text-muted-foreground">Se guarda en este dispositivo. El PDF siempre se imprime en hoja blanca.</p>
        </div>
      ),
      sinDatos: true,
    },
  ]
  const actual = OPCIONES.find((o) => o.clave === abierta)

  return (
    <>
      <Encabezado titulo="Configuración" descripcion="Elige una opción para cambiarla." />
      {error && <MensajeError error={error} className="mb-4" />}

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {OPCIONES.map((opcion) => {
          const Icono = opcion.icono
          const listo = opcion.sinDatos || datos
          return (
            <li key={opcion.clave}>
              <button
                type="button"
                onClick={() => abrir(opcion.clave)}
                disabled={!listo}
                aria-haspopup="dialog"
                className="group flex h-full w-full flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-wait disabled:opacity-70"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Icono className="size-4.5" aria-hidden="true" />
                  </span>
                  <span className="flex-1 font-medium">{opcion.titulo}</span>
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </div>
                <p className="text-sm text-muted-foreground">{opcion.descripcion}</p>
                <div className="mt-auto flex items-center gap-2 text-xs font-medium">
                  {opcion.muestra && <Muestra />}
                  {listo ? <span>{opcion.resumen}</span> : <Cargando texto="Cargando…" className="text-xs" />}
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      <Dialog open={!!actual && (actual.sinDatos || !!datos)} onOpenChange={(abrirla) => !abrirla && cerrar()}>
        {actual && (
          <DialogContent className={cn(actual.ancho)}>
            <DialogHeader>
              <DialogTitle>{actual.titulo}</DialogTitle>
              <DialogDescription>{actual.descripcion}</DialogDescription>
            </DialogHeader>
            {/* pb-0: los pinceles del horario van pegados abajo. */}
            <DialogBody className={actual.clave === 'horario' ? 'pb-0' : undefined}>{actual.contenido}</DialogBody>
          </DialogContent>
        )}
      </Dialog>
      {cargando && abierta && abierta !== 'colores' && <Cargando texto="Cargando tus clases…" className="mt-4" />}
    </>
  )
}

// Puntos con los colores actuales de algunos elementos (siguen el tema).
function Muestra() {
  return (
    <span className="flex -space-x-1" aria-hidden="true">
      {ELEMENTOS.slice(0, 6).map(([clave]) => (
        <span key={clave} className="size-3.5 rounded-full border-2 border-card" style={{ background: `var(--md-${clave}, var(--md-${clave}-base))` }} />
      ))}
    </span>
  )
}
