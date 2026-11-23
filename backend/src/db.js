import pg from 'pg';
import { config } from './config.js';

// enableChannelBinding: Neon lo pide (channel_binding=require) y pg no lo lee de la URL.
export const pool = new pg.Pool({ connectionString: config.databaseUrl, enableChannelBinding: true });

export function query(texto, valores) {
  return pool.query(texto, valores);
}

export async function crearTablas() {
  await query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id             TEXT PRIMARY KEY,           -- "sub" de Google
      nombre         TEXT NOT NULL,
      correo         TEXT NOT NULL,
      foto           TEXT,
      refresh_token  TEXT,
      creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS documentos (
      id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      usuario_id     TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      titulo         TEXT NOT NULL DEFAULT 'Sin título',
      contenido      TEXT NOT NULL DEFAULT '',
      opciones       JSONB NOT NULL DEFAULT '{}'::jsonb,
      curso_id       TEXT,                       -- curso de Classroom (opcional)
      tarea_id       TEXT,                       -- tarea de Classroom (opcional)
      creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
      actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS documentos_usuario_idx ON documentos (usuario_id);

    CREATE TABLE IF NOT EXISTS horarios (
      id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      usuario_id  TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      curso_id    TEXT NOT NULL,
      dia         SMALLINT NOT NULL CHECK (dia BETWEEN 0 AND 6),  -- 0 = domingo
      hora_inicio TIME NOT NULL,
      hora_fin    TIME NOT NULL,
      CHECK (hora_fin > hora_inicio)
    );
    CREATE INDEX IF NOT EXISTS horarios_usuario_idx ON horarios (usuario_id);

    -- Materias de Classroom que el usuario quiere ver. NULL = todavía no elige
    -- (primer acceso): el frontend le muestra la pantalla para escogerlas.
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS materias TEXT[];

    -- Colores del editor elegidos por el usuario, como JSON: { "negrita": "#e11d48", ... }.
    -- Solo los que cambió; los demás usan la paleta predeterminada del frontend.
    ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS colores JSONB;
  `);
}
