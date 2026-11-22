// Mensajes de carga y de error que comparten todas las páginas.

export function Cargando({ texto = 'Cargando…' }) {
  return <p className="mensaje" aria-live="polite">{texto}</p>
}

const MENSAJES = {
  sin_permiso: 'Google no dio permiso para leer Classroom con esta cuenta. Si es una cuenta escolar, puede que tu institución bloquee apps externas.',
  no_encontrado: 'No se encontró. Puede que ya no tengas acceso a esta clase o tarea.',
  limite: 'Google está recibiendo demasiadas peticiones. Intenta de nuevo en un momento.',
}

export function MensajeError({ error }) {
  return (
    <p className="mensaje mensaje-error" role="alert">
      {MENSAJES[error?.codigo] ?? error?.message ?? 'Algo salió mal.'}
    </p>
  )
}

export function Etiqueta({ texto, tono }) {
  return <span className={`etiqueta${tono ? ` etiqueta-${tono}` : ''}`}>{texto}</span>
}
