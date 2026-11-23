// Materias activas: las clases de Classroom que el usuario eligió ver.
// materias = null significa que todavía no elige, y se muestran todas.

export function soloActivas(clases, materias) {
  if (!materias) return clases
  const activas = new Set(materias)
  return clases.filter((c) => activas.has(c.id))
}
