// Todas las llamadas al backend pasan por aquí.
// credentials: 'include' manda la cookie de sesión.

export class ErrorApi extends Error {
  constructor(status, mensaje, codigo) {
    super(mensaje)
    this.status = status
    this.codigo = codigo
  }
}

// El plan gratis de Render se duerme tras 15 minutos sin uso y tarda hasta un
// minuto en despertar. Mientras tanto, el proxy de Vercel puede responder
// 502/503/504 o la conexión puede fallar: las consultas (GET) se reintentan
// solas durante unos 75 segundos antes de mostrar el error.
const ESPERAS = [2, 3, 5, 5, 10, 10, 10, 15, 15].map((s) => s * 1000)
const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms))
// Un 502/503 que manda nuestro backend trae { error }; el del proxy no.
const servidorDormido = (res, datos) => [502, 503, 504].includes(res.status) && !datos?.error

async function intentar(ruta, opciones) {
  try {
    const res = await fetch(ruta, { credentials: 'include', ...opciones })
    return { res, datos: await res.json().catch(() => null) }
  } catch {
    return { res: null, datos: null } // sin conexión
  }
}

async function pedir(ruta, opciones = {}) {
  const consulta = !opciones.method || opciones.method === 'GET'
  let { res, datos } = await intentar(ruta, opciones)
  for (const espera of consulta ? ESPERAS : []) {
    if (res && !servidorDormido(res, datos)) break
    await esperar(espera)
    ;({ res, datos } = await intentar(ruta, opciones))
  }

  if (!res) throw new ErrorApi(0, 'No hay conexión con el servidor.', 'red')
  if (servidorDormido(res, datos)) throw new ErrorApi(res.status, 'El servidor no responde.', 'servidor')

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
// materias: ids de los cursos de Classroom que se muestran en la app.
export const guardarMaterias = (materias) => enviar('/api/yo/materias', 'PUT', { materias })
// El login es una navegación completa (no fetch) porque pasa por la pantalla de Google.
export const URL_LOGIN = '/auth/google'
// Una petición ligera para que Render empiece a arrancar; no importa la respuesta.
export const despertarServidor = () => fetch('/api/health').catch(() => {})

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
// Reemplaza los bloques de las materias en `cursos` por `bloques`
// ({ cursoId, dia (0 = domingo), horaInicio: 'HH:MM', horaFin: 'HH:MM' }).
// Los de otras materias se conservan. Devuelve el horario completo.
export const guardarHorario = (cursos, bloques) => enviar('/api/horarios', 'PUT', { cursos, bloques })
