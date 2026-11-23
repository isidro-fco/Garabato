// Colores para distinguir las materias en el calendario. Tonos medios: el
// texto blanco se lee bien en modo claro y oscuro.
const COLORES = ['#2563eb', '#16a34a', '#db2777', '#ea580c', '#7c3aed', '#0891b2', '#b45309', '#0d9488']

// cursoId → color, según el orden de las clases (estable mientras no cambien).
export function coloresPorClase(clases = []) {
  return new Map(clases.map((c, i) => [c.id, COLORES[i % COLORES.length]]))
}

export const COLOR_SIN_CLASE = '#64748b'

// Orden de la semana escolar: lunes primero. dia: 0 = domingo, como Date#getDay.
export const DIAS = [
  [1, 'Lunes', 'Lun'],
  [2, 'Martes', 'Mar'],
  [3, 'Miércoles', 'Mié'],
  [4, 'Jueves', 'Jue'],
  [5, 'Viernes', 'Vie'],
  [6, 'Sábado', 'Sáb'],
  [0, 'Domingo', 'Dom'],
]

// "07:00" → 7 h en minutos y al revés, para calcular el rango visible del horario.
const aMinutos = (hora) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5))
const aHora = (minutos) => `${String(Math.floor(minutos / 60)).padStart(2, '0')}:00`

// Rango de horas del calendario semanal: de la primera clase a la última, con
// una hora de margen. Sin horarios, de 7:00 a 15:00.
export function rangoHorario(horarios) {
  if (horarios.length === 0) return { inicio: '07:00', fin: '15:00' }
  const inicio = Math.min(...horarios.map((h) => aMinutos(h.horaInicio)))
  const fin = Math.max(...horarios.map((h) => aMinutos(h.horaFin)))
  return { inicio: aHora(Math.max(0, inicio - 60)), fin: aHora(Math.min(24 * 60, Math.ceil(fin / 60) * 60 + 60)) }
}

// "07:30" → "7:30", en 24 h como el calendario.
const formatoHora = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit', hourCycle: 'h23' })
export function formatearHora(hora) {
  return formatoHora.format(new Date(2000, 0, 1, Number(hora.slice(0, 2)), Number(hora.slice(3, 5))))
}

// --- Tabla para pintar el horario (Configuración) ---
// La semana se divide en celdas de una hora. Una celda se identifica con
// "dia|minuto" (minuto del día en que empieza) y guarda el id de la materia.

export const MINUTOS_CELDA = 60
export const claveCelda = (dia, minuto) => `${dia}|${minuto}`
const horaMinutos = (minutos) => `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`

// Bloques guardados → celdas. Una celda se pinta si la clase ocupa al menos la
// mitad de ella (así una clase de 7:20 a 9:00 queda de 7:00 a 9:00).
export function celdasDesdeHorarios(horarios) {
  const celdas = new Map()
  for (const h of horarios) {
    const inicio = aMinutos(h.horaInicio)
    const fin = aMinutos(h.horaFin)
    for (let m = Math.floor(inicio / MINUTOS_CELDA) * MINUTOS_CELDA; m < fin; m += MINUTOS_CELDA) {
      const ocupado = Math.min(m + MINUTOS_CELDA, fin) - Math.max(m, inicio)
      if (ocupado * 2 >= MINUTOS_CELDA) celdas.set(claveCelda(h.dia, m), h.cursoId)
    }
  }
  return celdas
}

// Celdas → bloques: las celdas seguidas de la misma materia se unen en uno.
export function bloquesDesdeCeldas(celdas) {
  const ordenadas = [...celdas]
    .map(([clave, cursoId]) => {
      const [dia, minuto] = clave.split('|').map(Number)
      return { dia, minuto, cursoId }
    })
    .sort((a, b) => a.dia - b.dia || a.minuto - b.minuto)
  const bloques = []
  for (const { dia, minuto, cursoId } of ordenadas) {
    const ultimo = bloques.at(-1)
    if (ultimo && ultimo.dia === dia && ultimo.cursoId === cursoId && ultimo.fin === minuto) ultimo.fin += MINUTOS_CELDA
    else bloques.push({ cursoId, dia, inicio: minuto, fin: minuto + MINUTOS_CELDA })
  }
  // La API acepta horas hasta 23:59.
  return bloques.map(({ cursoId, dia, inicio, fin }) => ({ cursoId, dia, horaInicio: horaMinutos(inicio), horaFin: horaMinutos(Math.min(fin, 23 * 60 + 59)) }))
}

// Horas que muestra la tabla: de 7:00 a 22:00, o más si ya hay clases fuera.
export function rangoTabla(horarios) {
  const inicios = horarios.map((h) => aMinutos(h.horaInicio))
  const fines = horarios.map((h) => aMinutos(h.horaFin))
  return {
    inicio: Math.min(7 * 60, ...inicios.map((m) => Math.floor(m / 60) * 60)),
    fin: Math.max(22 * 60, ...fines.map((m) => Math.min(24 * 60, Math.ceil(m / 60) * 60))),
  }
}
