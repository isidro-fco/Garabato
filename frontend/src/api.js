// Todas las llamadas al backend pasan por aquí.
// credentials: 'include' manda la cookie de sesión.

export class ErrorApi extends Error {
  constructor(status, mensaje, codigo) {
    super(mensaje)
    this.status = status
    this.codigo = codigo
  }
}

async function pedir(ruta, opciones = {}) {
  const res = await fetch(ruta, { credentials: 'include', ...opciones })
  const datos = await res.json().catch(() => null)

  if (!res.ok) {
    // Sesión terminada o conexión con Google vencida: volver al login.
    // /api/yo se maneja aparte en RutaPrivada.
    if (res.status === 401 && ruta !== '/api/yo') {
      const motivo = datos?.codigo === 'reconectar' ? 'reconectar' : 'sesion'
      window.location.assign(`/login?error=${motivo}`)
    }
    throw new ErrorApi(res.status, datos?.error ?? `Error ${res.status}`, datos?.codigo)
  }
  return datos
}

function enviar(ruta, method, cuerpo, opciones = {}) {
  return pedir(ruta, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
    ...opciones,
  })
}

const id = (valor) => encodeURIComponent(valor)

// --- Sesión ---
export const obtenerYo = () => pedir('/api/yo')
export const cerrarSesion = () => pedir('/auth/logout', { method: 'POST' })
// El login es una navegación completa (no fetch) porque pasa por la pantalla de Google.
export const URL_LOGIN = '/auth/google'

// --- Classroom ---
export const listarClases = () => pedir('/api/clases')
export const obtenerClase = (cursoId) => pedir(`/api/clases/${id(cursoId)}`)
export const listarTareas = (cursoId) => pedir(`/api/clases/${id(cursoId)}/tareas`)
export const obtenerTarea = (cursoId, tareaId) => pedir(`/api/clases/${id(cursoId)}/tareas/${id(tareaId)}`)
export const listarPendientes = () => pedir('/api/tareas/pendientes')

// --- Documentos ---
// filtros: { cursoId, tareaId } opcionales
export function listarDocumentos(filtros = {}) {
  const params = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v))
  return pedir(`/api/documentos${params.size ? `?${params}` : ''}`)
}
export const obtenerDocumento = (docId) => pedir(`/api/documentos/${id(docId)}`)
export const crearDocumento = (datos = {}) => enviar('/api/documentos', 'POST', datos)
// keepalive: la petición sigue aunque se cierre la pestaña (máximo 64 KB).
export const actualizarDocumento = (docId, cambios, { keepalive = false } = {}) =>
  enviar(`/api/documentos/${id(docId)}`, 'PATCH', cambios, { keepalive })
export const eliminarDocumento = (docId) => pedir(`/api/documentos/${id(docId)}`, { method: 'DELETE' })

// --- Horarios ---
export const listarHorarios = () => pedir('/api/horarios')
// datos: { cursoId, dia (0 = domingo), horaInicio: 'HH:MM', horaFin: 'HH:MM' }
export const crearHorario = (datos) => enviar('/api/horarios', 'POST', datos)
export const eliminarHorario = (horarioId) => pedir(`/api/horarios/${id(horarioId)}`, { method: 'DELETE' })
