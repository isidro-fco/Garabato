import { pool, query } from '../../db.js';
import { listarClases } from '../classroom/classroom.service.js';

// Las materias propias se identifican en el horario con este prefijo + su id.
export const PREFIJO = 'propia-';

// Nombre repetido: ya existe en Classroom o entre sus materias propias.
export class ErrorMateriaRepetida extends Error {}

// Para comparar nombres: sin mayúsculas, acentos ni espacios de más.
export const normalizar = (nombre) =>
  nombre.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase();

const aMateria = (fila) => ({ id: `${PREFIJO}${fila.id}`, nombre: fila.nombre });

export async function listarMateriasPropias(usuarioId) {
  const { rows } = await query(
    'SELECT id, nombre FROM materias_propias WHERE usuario_id = $1 ORDER BY creado_en, id',
    [usuarioId],
  );
  return rows.map(aMateria);
}

export async function crearMateriaPropia(usuarioId, nombre) {
  nombre = nombre.replace(/\s+/g, ' ').trim();
  const buscado = normalizar(nombre);
  const [clases, propias] = await Promise.all([listarClases(usuarioId), listarMateriasPropias(usuarioId)]);
  const enClassroom = clases.find((c) => normalizar(c.nombre) === buscado);
  if (enClassroom) {
    throw new ErrorMateriaRepetida(`«${enClassroom.nombre}» ya está en tus clases de Classroom (si no la ves, actívala en Materias).`);
  }
  const propia = propias.find((m) => normalizar(m.nombre) === buscado);
  if (propia) throw new ErrorMateriaRepetida(`Ya agregaste «${propia.nombre}».`);

  try {
    const { rows } = await query(
      'INSERT INTO materias_propias (usuario_id, nombre) VALUES ($1, $2) RETURNING id, nombre',
      [usuarioId, nombre],
    );
    return aMateria(rows[0]);
  } catch (err) {
    // Índice único: otra pestaña la agregó al mismo tiempo.
    if (err.code === '23505') throw new ErrorMateriaRepetida(`Ya agregaste «${nombre}».`);
    throw err;
  }
}

// Borra la materia y sus horas del horario.
export async function eliminarMateriaPropia(usuarioId, id) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const { rowCount } = await cliente.query('DELETE FROM materias_propias WHERE id = $1 AND usuario_id = $2', [id, usuarioId]);
    await cliente.query('DELETE FROM horarios WHERE usuario_id = $1 AND curso_id = $2', [usuarioId, `${PREFIJO}${id}`]);
    await cliente.query('COMMIT');
    return rowCount > 0;
  } catch (err) {
    await cliente.query('ROLLBACK');
    throw err;
  } finally {
    cliente.release();
  }
}
