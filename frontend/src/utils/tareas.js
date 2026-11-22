const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

// La fecha llega en UTC; se muestra en la hora local del navegador.
export function formatearFecha(iso) {
  return iso ? formatoFecha.format(new Date(iso)) : 'Sin fecha de entrega'
}

// { texto, tono } para la etiqueta de estado de una tarea.
export function estadoTarea(tarea) {
  if (tarea.entregada) {
    return { texto: tarea.tarde ? 'Entregada tarde' : 'Entregada', tono: 'ok' }
  }
  if (!tarea.fechaEntrega) return { texto: 'Sin fecha', tono: null }
  if (new Date(tarea.fechaEntrega) < new Date()) return { texto: 'Atrasada', tono: 'alerta' }
  return { texto: 'Pendiente', tono: 'aviso' }
}
