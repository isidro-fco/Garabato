// Materias activas: las clases de Classroom que el usuario eligió ver.
// materias = null significa que todavía no elige, y se muestran todas.

export function soloActivas(clases, materias) {
  if (!materias) return clases
  const activas = new Set(materias)
  return clases.filter((c) => activas.has(c.id))
}

// Materias propias: las que el usuario agrega porque no tienen clase en Classroom.
export const esPropia = (cursoId) => cursoId.startsWith('propia-')

// Para comparar nombres: sin mayúsculas, acentos ni espacios de más.
export const normalizarNombre = (nombre) =>
  nombre.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase()

// Mensaje de error si el nombre ya existe en Classroom o entre las propias; si no, null.
export function nombreRepetido(nombre, clases, propias) {
  const buscado = normalizarNombre(nombre)
  const enClassroom = clases.find((c) => normalizarNombre(c.nombre) === buscado)
  if (enClassroom) return `«${enClassroom.nombre}» ya está en tus clases de Classroom (si no la ves, actívala en Materias).`
  const propia = propias.find((m) => normalizarNombre(m.nombre) === buscado)
  if (propia) return `Ya agregaste «${propia.nombre}».`
  return null
}
