import esLocale from '@fullcalendar/core/locales/es'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { CalendarDays, CircleAlert, Clock } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { listarClases, listarHorarios, listarPendientes } from '../api.js'
import { Cargando, Encabezado, MensajeError } from '../componentes/Estado.jsx'
import { Tabs, TabsList, TabsTrigger } from '@/componentes/ui/tabs'
import { COLOR_SIN_CLASE, coloresPorClase, rangoHorario } from '../utils/horario.js'
import { soloActivas } from '../utils/materias.js'
import { useCargar } from '../utils/useCargar.js'
import { useMediaQuery } from '../utils/useMediaQuery.js'

// Opciones comunes de los dos calendarios.
const BASE = {
  locale: esLocale,
  firstDay: 1,
  height: 'auto',
  nowIndicator: true,
}

export default function Inicio() {
  const { usuario, materias } = useOutletContext()
  const [params, setParams] = useSearchParams()
  const vista = params.get('vista') === 'horario' ? 'horario' : 'entregas'
  // Las clases solo dan nombre y color; si Classroom falla, el calendario sigue.
  const clases = useCargar(() => listarClases().catch(() => []), [])
  const activas = clases.datos && soloActivas(clases.datos, materias)

  return (
    <>
      <Encabezado
        titulo={`Hola, ${usuario.nombre.split(' ')[0]}`}
        descripcion={vista === 'horario' ? 'Tu semana de clases.' : 'Tus entregas pendientes.'}
        accion={(
          <Tabs value={vista} onValueChange={(v) => setParams(v === 'horario' ? { vista: v } : {}, { replace: true })}>
            <TabsList>
              <TabsTrigger value="entregas"><CalendarDays />Entregas</TabsTrigger>
              <TabsTrigger value="horario"><Clock />Horario</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      />
      {clases.cargando
        ? <Cargando />
        : vista === 'horario'
          ? <Horario clases={activas} materias={materias} />
          : <Entregas clases={activas} materias={materias} />}
    </>
  )
}

// Con materias elegidas, solo se ven las entregas y clases de esas materias.
const deMaterias = (lista, materias) => (materias ? lista.filter((x) => materias.includes(x.cursoId)) : lista)

function Entregas({ clases, materias }) {
  const navigate = useNavigate()
  const esMovil = useMediaQuery('(max-width: 767px)')
  const pendientes = useCargar(listarPendientes, [])
  const { cargando, error } = pendientes
  const tareas = pendientes.datos && deMaterias(pendientes.datos, materias)
  const [ahora] = useState(() => new Date())
  if (cargando) return <Cargando texto="Cargando tus entregas…" />
  if (error) return <MensajeError error={error} />

  const colores = coloresPorClase(clases)
  const eventos = tareas.map((t) => ({
    id: t.id,
    title: t.titulo,
    start: t.fechaEntrega,
    color: colores.get(t.cursoId) ?? COLOR_SIN_CLASE,
    classNames: new Date(t.fechaEntrega) < ahora ? ['evento-atrasado'] : [],
    extendedProps: { cursoId: t.cursoId, curso: t.curso, atrasada: new Date(t.fechaEntrega) < ahora },
  }))
  const atrasadas = eventos.filter((e) => e.extendedProps.atrasada).length

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {tareas.length === 0
          ? 'No tienes entregas pendientes. 🎉'
          : `${tareas.length} ${tareas.length === 1 ? 'entrega pendiente' : 'entregas pendientes'}`}
        {atrasadas > 0 && <span className="text-destructive"> · {atrasadas} {atrasadas === 1 ? 'atrasada' : 'atrasadas'}</span>}
      </p>
      <div className="calendario rounded-xl border bg-card p-3 md:p-4">
        <FullCalendar
          {...BASE}
          // En celular la cuadrícula del mes no cabe: se muestra como lista.
          key={esMovil ? 'lista' : 'mes'}
          plugins={[dayGridPlugin, listPlugin]}
          initialView={esMovil ? 'listMonth' : 'dayGridMonth'}
          headerToolbar={{ left: 'title', right: 'today prev,next' }}
          events={eventos}
          eventDisplay="block"
          // Una entrega es un instante, no un rango. Con la duración por defecto
          // (1 h), una tarea de las 23:59 se estiraba hasta el día siguiente.
          defaultTimedEventDuration="00:00:01"
          dayMaxEvents={3}
          eventTimeFormat={{ hour: 'numeric', minute: '2-digit' }}
          noEventsContent="Sin entregas este mes"
          listDayFormat={{ weekday: 'long', day: 'numeric', month: 'long' }}
          listDaySideFormat={false}
          eventContent={ContenidoEntrega}
          eventClick={({ event, jsEvent }) => {
            jsEvent.preventDefault()
            navigate(`/clases/${event.extendedProps.cursoId}/tareas/${event.id}`)
          }}
        />
      </div>
    </div>
  )
}

function ContenidoEntrega({ event, timeText, view }) {
  if (view.type.startsWith('list')) {
    return (
      <span className="flex min-w-0 flex-col">
        <span className="flex items-center gap-1 font-medium">
          {event.extendedProps.atrasada && <CircleAlert className="size-3.5 shrink-0" aria-label="Atrasada" />}
          {event.title}
        </span>
        <span className="text-xs text-muted-foreground">{event.extendedProps.curso}</span>
      </span>
    )
  }
  return (
    <span className="flex min-w-0 items-center gap-1" title={`${event.title} · ${event.extendedProps.curso}`}>
      {event.extendedProps.atrasada && <CircleAlert className="size-3.5 shrink-0" aria-label="Atrasada" />}
      <span className="shrink-0 opacity-80">{timeText}</span>
      <span className="truncate font-medium">{event.title}</span>
    </span>
  )
}

function Horario({ clases, materias }) {
  const navigate = useNavigate()
  const esMovil = useMediaQuery('(max-width: 767px)')
  const bloques = useCargar(listarHorarios, [])
  const { cargando, error } = bloques
  const horarios = bloques.datos && deMaterias(bloques.datos, materias)
  if (cargando) return <Cargando texto="Cargando tu horario…" />
  if (error) return <MensajeError error={error} />

  const colores = coloresPorClase(clases)
  const nombres = new Map(clases.map((c) => [c.id, c.nombre]))
  const { inicio, fin } = rangoHorario(horarios)
  const eventos = horarios.map((h) => ({
    id: String(h.id),
    title: nombres.get(h.cursoId) ?? 'Clase',
    daysOfWeek: [h.dia],
    startTime: h.horaInicio,
    endTime: h.horaFin,
    color: colores.get(h.cursoId) ?? COLOR_SIN_CLASE,
    extendedProps: { cursoId: h.cursoId },
  }))
  // ¿Hay clases en fin de semana? Si no, la semana va de lunes a viernes.
  const conFinDeSemana = horarios.some((h) => h.dia === 0 || h.dia === 6)
  // En celular se ve un día: si hoy no hay clases, abre en el siguiente día que sí tenga.
  const diaInicial = siguienteDiaConClase(horarios)

  return (
    <div className="space-y-3">
      {horarios.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Todavía no capturas tu horario. Hazlo en{' '}
          <Link to="/configuracion" className="font-medium text-foreground underline underline-offset-4">Configuración</Link>.
        </p>
      )}
      <div className="calendario rounded-xl border bg-card p-3 md:p-4">
        <FullCalendar
          {...BASE}
          // En celular se ve un día a la vez.
          key={esMovil ? 'dia' : 'semana'}
          plugins={[timeGridPlugin]}
          initialView={esMovil ? 'timeGridDay' : 'timeGridWeek'}
          initialDate={esMovil ? diaInicial : undefined}
          // El horario se repite cada semana: en escritorio no hace falta navegar.
          headerToolbar={esMovil ? { left: 'title', right: 'today prev,next' } : false}
          dayHeaderFormat={esMovil ? { weekday: 'long', day: 'numeric' } : { weekday: 'long' }}
          weekends={esMovil || conFinDeSemana}
          allDaySlot={false}
          slotMinTime={inicio}
          slotMaxTime={fin}
          slotDuration="00:30:00"
          slotLabelFormat={{ hour: 'numeric', minute: '2-digit' }}
          events={eventos}
          eventClick={({ event }) => navigate(`/clases/${event.extendedProps.cursoId}`)}
        />
      </div>
    </div>
  )
}

// Hoy o el siguiente día de la semana con alguna clase (hoy si no hay horario).
function siguienteDiaConClase(horarios) {
  const fecha = new Date()
  const dias = new Set(horarios.map((h) => h.dia))
  for (let i = 0; i < 7 && dias.size && !dias.has(fecha.getDay()); i++) fecha.setDate(fecha.getDate() + 1)
  return fecha
}
