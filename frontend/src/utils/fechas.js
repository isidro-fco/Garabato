const relativo = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' })
const formatoDia = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

// "hace 5 minutos", "ayer", o la fecha si pasó más de una semana.
export function haceCuanto(iso) {
  const segundos = Math.round((new Date(iso) - Date.now()) / 1000)
  const abs = Math.abs(segundos)
  if (abs < 60) return 'hace un momento'
  if (abs < 3600) return relativo.format(Math.round(segundos / 60), 'minute')
  if (abs < 86400) return relativo.format(Math.round(segundos / 3600), 'hour')
  if (abs < 7 * 86400) return relativo.format(Math.round(segundos / 86400), 'day')
  return formatoDia.format(new Date(iso))
}
