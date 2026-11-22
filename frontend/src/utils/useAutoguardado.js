import { useEffect, useMemo, useRef, useState } from 'react'
import { actualizarDocumento } from '../api.js'

// Límite de fetch con keepalive; arriba de esto se pide confirmación al salir.
const LIMITE_KEEPALIVE = 60 * 1024

// --- Respaldo local ---
// Al salir con cambios sin guardar también se guardan en localStorage. Si al volver
// el servidor todavía no los tiene (la petición no llegó o llegó tarde), se recuperan.
const clave = (docId) => `garabato:borrador:${docId}`

function guardarRespaldo(docId, base, cambios) {
  try {
    localStorage.setItem(clave(docId), JSON.stringify({ base, cambios }))
  } catch {
    // Sin localStorage (modo privado, lleno): solo queda el guardado normal.
  }
}

function borrarRespaldo(docId) {
  try {
    localStorage.removeItem(clave(docId))
  } catch {
    // nada que hacer
  }
}

// Devuelve los cambios a recuperar para `doc`, o null.
// Se descartan si el servidor ya los tiene o si el documento cambió después (por ejemplo,
// se editó en otro dispositivo): en ese caso gana la versión del servidor.
export function recuperarRespaldo(doc) {
  let respaldo
  try {
    respaldo = JSON.parse(localStorage.getItem(clave(doc.id)))
  } catch {
    return null
  }
  if (!respaldo?.cambios) return null

  const yaGuardado = Object.entries(respaldo.cambios)
    .every(([campo, valor]) => JSON.stringify(doc[campo]) === JSON.stringify(valor))
  if (yaGuardado || respaldo.base !== doc.actualizadoEn) {
    borrarRespaldo(doc.id)
    return null
  }
  return respaldo.cambios
}

// Junta los cambios y los guarda cuando pasan `retraso` ms sin escribir.
// Nunca hay dos guardados al mismo tiempo, así que no llegan en desorden.
// estado: 'guardado' | 'pendiente' | 'guardando' | 'error'
export function useAutoguardado(doc, retraso = 1500) {
  const docId = doc.id
  const [estado, setEstado] = useState('guardado')
  const pendiente = useRef(null)
  const enCurso = useRef(false)
  const temporizador = useRef(null)
  // Última versión confirmada por el servidor; sirve para validar el respaldo local.
  const base = useRef(doc.actualizadoEn)

  const { cambiar, guardarAhora } = useMemo(() => {
    function programar(ms) {
      clearTimeout(temporizador.current)
      temporizador.current = setTimeout(guardar, ms)
    }

    async function guardar() {
      clearTimeout(temporizador.current)
      if (enCurso.current || !pendiente.current) return

      const cambios = pendiente.current
      pendiente.current = null
      enCurso.current = true
      setEstado('guardando')
      try {
        const guardado = await actualizarDocumento(docId, cambios)
        base.current = guardado.actualizadoEn
        enCurso.current = false
        if (pendiente.current) {
          // Se siguió escribiendo mientras se guardaba.
          setEstado('pendiente')
          programar(retraso)
        } else {
          borrarRespaldo(docId)
          setEstado('guardado')
        }
      } catch {
        enCurso.current = false
        pendiente.current = { ...cambios, ...pendiente.current }
        setEstado('error')
        programar(5000) // reintentar
      }
    }

    function cambiar(campos) {
      pendiente.current = { ...pendiente.current, ...campos }
      setEstado('pendiente')
      programar(retraso)
    }

    return { cambiar, guardarAhora: guardar }
  }, [docId, retraso])

  useEffect(() => {
    // Al cerrar o recargar la pestaña: respaldar y mandar lo pendiente con keepalive.
    // Si es muy grande para keepalive, o hay un guardado en curso, pedir confirmación.
    function antesDeSalir(evento) {
      const cambios = pendiente.current
      if (cambios) guardarRespaldo(docId, base.current, cambios)
      if (cambios && JSON.stringify(cambios).length <= LIMITE_KEEPALIVE) {
        pendiente.current = null
        actualizarDocumento(docId, cambios, { keepalive: true }).catch(() => {})
      }
      if (pendiente.current || enCurso.current) {
        evento.preventDefault()
        evento.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', antesDeSalir)

    return () => {
      window.removeEventListener('beforeunload', antesDeSalir)
      clearTimeout(temporizador.current)
      // Al salir del editor dentro de la app: guardar lo pendiente de inmediato.
      const cambios = pendiente.current
      if (cambios) {
        pendiente.current = null
        guardarRespaldo(docId, base.current, cambios)
        actualizarDocumento(docId, cambios)
          .then(() => borrarRespaldo(docId))
          .catch(() => {})
      }
    }
  }, [docId])

  return { estado, cambiar, guardarAhora }
}
