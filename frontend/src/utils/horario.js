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
export const nombreDia = (dia) => DIAS.find(([d]) => d === dia)?.[1]
export const posicionDia = (dia) => (dia + 6) % 7

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

// Dos bloques del mismo día se enciman.
export const seEnciman = (a, b) =>
  a.dia === b.dia && aMinutos(a.horaInicio) < aMinutos(b.horaFin) && aMinutos(b.horaInicio) < aMinutos(a.horaFin)

// "07:30" → "7:30", en 24 h como el calendario.
const formatoHora = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit', hourCycle: 'h23' })
export function formatearHora(hora) {
  return formatoHora.format(new Date(2000, 0, 1, Number(hora.slice(0, 2)), Number(hora.slice(3, 5))))
}
