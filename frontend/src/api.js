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
