import { pool, query } from '../../db.js';

const COLUMNAS = `id, curso_id, dia, to_char(hora_inicio, 'HH24:MI') AS hora_inicio, to_char(hora_fin, 'HH24:MI') AS hora_fin`;

// Campos que acepta la API → columna en la tabla.
const CAMPOS = {
  cursoId: 'curso_id',
  dia: 'dia',
  horaInicio: 'hora_inicio',
  horaFin: 'hora_fin',
};

// La hora de fin debe ser posterior a la de inicio (CHECK en la tabla).
export class ErrorHorario extends Error {}

function aHorario(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    cursoId: fila.curso_id,
    dia: fila.dia,
    horaInicio: fila.hora_inicio,
    horaFin: fila.hora_fin,
  };
}

// Convierte la violación del CHECK de la tabla en un error de validación.
async function conValidacion(consulta) {
  try {
    return await consulta;
  } catch (err) {
    if (err.code === '23514') throw new ErrorHorario('La hora de fin debe ser posterior a la de inicio');
    throw err;
  }
}

export async function listarHorarios(usuarioId) {
  const { rows } = await query(
    `SELECT ${COLUMNAS} FROM horarios WHERE usuario_id = $1 ORDER BY dia, hora_inicio`,
    [usuarioId],
  );
  return rows.map(aHorario);
}

export async function crearHorario(usuarioId, { cursoId, dia, horaInicio, horaFin }) {
  const { rows } = await conValidacion(query(
    `INSERT INTO horarios (usuario_id, curso_id, dia, hora_inicio, hora_fin)
     VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUMNAS}`,
    [usuarioId, cursoId, dia, horaInicio, horaFin],
  ));
  return aHorario(rows[0]);
}

export async function actualizarHorario(usuarioId, id, cambios) {
  const columnas = Object.keys(cambios).filter((c) => c in CAMPOS);
  if (columnas.length === 0) {
    const { rows } = await query(`SELECT ${COLUMNAS} FROM horarios WHERE id = $1 AND usuario_id = $2`, [id, usuarioId]);
    return aHorario(rows[0]);
  }
  const asignaciones = columnas.map((c, i) => `${CAMPOS[c]} = $${i + 3}`);
  const { rows } = await conValidacion(query(
    `UPDATE horarios SET ${asignaciones.join(', ')} WHERE id = $1 AND usuario_id = $2 RETURNING ${COLUMNAS}`,
    [id, usuarioId, ...columnas.map((c) => cambios[c])],
  ));
  return aHorario(rows[0]);
}

export async function eliminarHorario(usuarioId, id) {
  const { rowCount } = await query('DELETE FROM horarios WHERE id = $1 AND usuario_id = $2', [id, usuarioId]);
  return rowCount > 0;
}

// Reemplaza de una vez el horario de las materias indicadas (la tabla que se
// pinta en Configuración). Los bloques de otras materias no se tocan.
export async function reemplazarHorarios(usuarioId, cursos, bloques) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    // Un guardado a la vez por usuario: si llegan dos juntos (dos pestañas,
    // reintentos), el segundo espera al primero y no se duplican los bloques.
    await cliente.query('SELECT 1 FROM usuarios WHERE id = $1 FOR UPDATE', [usuarioId]);
    await cliente.query('DELETE FROM horarios WHERE usuario_id = $1 AND curso_id = ANY($2)', [usuarioId, cursos]);
    for (const { cursoId, dia, horaInicio, horaFin } of bloques) {
      await cliente.query(
        'INSERT INTO horarios (usuario_id, curso_id, dia, hora_inicio, hora_fin) VALUES ($1, $2, $3, $4, $5)',
        [usuarioId, cursoId, dia, horaInicio, horaFin],
      );
    }
    await cliente.query('COMMIT');
  } catch (err) {
    await cliente.query('ROLLBACK');
    if (err.code === '23514') throw new ErrorHorario('La hora de fin debe ser posterior a la de inicio');
    throw err;
  } finally {
    cliente.release();
  }
  return listarHorarios(usuarioId);
}
