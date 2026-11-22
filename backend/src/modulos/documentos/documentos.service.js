import { query } from '../../db.js';

const COLUMNAS = `id, titulo, contenido, opciones, curso_id, tarea_id, creado_en, actualizado_en`;
const COLUMNAS_LISTA = `id, titulo, curso_id, tarea_id, creado_en, actualizado_en`;

// Campos que acepta la API → columna en la tabla.
const CAMPOS = {
  titulo: 'titulo',
  contenido: 'contenido',
  opciones: 'opciones',
  cursoId: 'curso_id',
  tareaId: 'tarea_id',
};

function aDocumento(fila) {
  if (!fila) return null;
  const doc = {
    id: fila.id,
    titulo: fila.titulo,
    cursoId: fila.curso_id,
    tareaId: fila.tarea_id,
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
  if ('contenido' in fila) {
    doc.contenido = fila.contenido;
    doc.opciones = fila.opciones;
  }
  return doc;
}

export async function listarDocumentos(usuarioId, { cursoId, tareaId } = {}) {
  const condiciones = ['usuario_id = $1'];
  const valores = [usuarioId];
  if (cursoId) {
    valores.push(cursoId);
    condiciones.push(`curso_id = $${valores.length}`);
  }
  if (tareaId) {
    valores.push(tareaId);
    condiciones.push(`tarea_id = $${valores.length}`);
  }
  const { rows } = await query(
    `SELECT ${COLUMNAS_LISTA} FROM documentos
     WHERE ${condiciones.join(' AND ')}
     ORDER BY actualizado_en DESC`,
    valores,
  );
  return rows.map(aDocumento);
}

export async function obtenerDocumento(usuarioId, id) {
  const { rows } = await query(
    `SELECT ${COLUMNAS} FROM documentos WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId],
  );
  return aDocumento(rows[0]);
}

export async function crearDocumento(usuarioId, datos) {
  const { rows } = await query(
    `INSERT INTO documentos (usuario_id, titulo, contenido, opciones, curso_id, tarea_id)
     VALUES ($1, COALESCE($2, 'Sin título'), COALESCE($3, ''), COALESCE($4, '{}'::jsonb), $5, $6)
     RETURNING ${COLUMNAS}`,
    [
      usuarioId,
      datos.titulo ?? null,
      datos.contenido ?? null,
      datos.opciones ?? null,
      datos.cursoId ?? null,
      datos.tareaId ?? null,
    ],
  );
  return aDocumento(rows[0]);
}

// Actualiza solo los campos que vienen en `cambios` (para el autoguardado).
export async function actualizarDocumento(usuarioId, id, cambios) {
  const sets = [];
  const valores = [id, usuarioId];
  for (const [campo, columna] of Object.entries(CAMPOS)) {
    if (campo in cambios) {
      valores.push(cambios[campo]);
      sets.push(`${columna} = $${valores.length}`);
    }
  }
  if (sets.length === 0) return obtenerDocumento(usuarioId, id);

  const { rows } = await query(
    `UPDATE documentos SET ${sets.join(', ')}, actualizado_en = now()
     WHERE id = $1 AND usuario_id = $2
     RETURNING ${COLUMNAS_LISTA}`,
    valores,
  );
  return aDocumento(rows[0]);
}

export async function eliminarDocumento(usuarioId, id) {
  const { rowCount } = await query(
    'DELETE FROM documentos WHERE id = $1 AND usuario_id = $2',
    [id, usuarioId],
  );
  return rowCount > 0;
}
