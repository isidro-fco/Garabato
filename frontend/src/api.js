// Todas las llamadas al backend pasan por aquí.
// credentials: 'include' manda la cookie de sesión.

export class ErrorApi extends Error {
  constructor(status, mensaje) {
    super(mensaje)
    this.status = status
  }
}

async function pedir(ruta, opciones = {}) {
  const res = await fetch(ruta, { credentials: 'include', ...opciones })
  const datos = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ErrorApi(res.status, datos?.error ?? `Error ${res.status}`)
  }
  return datos
}

export const obtenerYo = () => pedir('/api/yo')

export const cerrarSesion = () => pedir('/auth/logout', { method: 'POST' })

// El login es una navegación completa (no fetch) porque pasa por la pantalla de Google.
export const URL_LOGIN = '/auth/google'
