import { query } from '../../db.js';

export async function obtenerPerfilGoogle(accessToken) {
  const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Google respondió ${res.status} al pedir el perfil`);
  }
  return res.json(); // { sub, name, email, picture, ... }
}

// Crea el usuario en su primer acceso o actualiza sus datos.
// Google no siempre manda refresh token, así que se conserva el anterior.
export async function guardarUsuario(perfil, refreshToken) {
  const { rows } = await query(
    `INSERT INTO usuarios (id, nombre, correo, foto, refresh_token)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       nombre = EXCLUDED.nombre,
       correo = EXCLUDED.correo,
       foto = EXCLUDED.foto,
       refresh_token = COALESCE(EXCLUDED.refresh_token, usuarios.refresh_token),
       actualizado_en = now()
     RETURNING id`,
    [perfil.sub, perfil.name ?? perfil.email, perfil.email, perfil.picture ?? null, refreshToken ?? null],
  );
  return rows[0].id;
}

export async function obtenerUsuario(id) {
  const { rows } = await query(
    'SELECT id, nombre, correo, foto, materias FROM usuarios WHERE id = $1',
    [id],
  );
  return rows[0] ?? null;
}

// Guarda las materias (ids de cursos de Classroom) que el usuario quiere ver.
export async function guardarMaterias(id, materias) {
  const { rows } = await query(
    'UPDATE usuarios SET materias = $2, actualizado_en = now() WHERE id = $1 RETURNING materias',
    [id, [...new Set(materias)]],
  );
  return rows[0]?.materias ?? null;
}
