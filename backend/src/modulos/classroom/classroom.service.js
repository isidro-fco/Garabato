import { auth, classroom as crearClassroom } from '@googleapis/classroom';
import { config } from '../../config.js';
import { query } from '../../db.js';

// Error con el código HTTP que debe responder la ruta.
export class ErrorClassroom extends Error {
  constructor(status, codigo, mensaje) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
  }
}

const sinPermiso = () =>
  new ErrorClassroom(403, 'sin_permiso', 'Google no dio permiso para leer Classroom con esta cuenta');

const reconectar = () =>
  new ErrorClassroom(401, 'reconectar', 'Tu conexión con Google venció. Vuelve a iniciar sesión.');

// Traduce los errores de Google a ErrorClassroom.
function traducirError(err) {
  if (err instanceof ErrorClassroom) return err;
  const status = err.response?.status ?? err.status;
  const motivo = err.response?.data?.error;
  if (motivo === 'invalid_grant' || err.message === 'invalid_grant' || err.message === 'No refresh token is set.') {
    return reconectar();
  }
  if (status === 401) return reconectar();
  if (status === 403) return sinPermiso();
  if (status === 404) return new ErrorClassroom(404, 'no_encontrado', 'No se encontró la clase o la tarea');
  if (status === 429) return new ErrorClassroom(503, 'limite', 'Google está limitando las peticiones. Intenta en un momento.');
  return err;
}

async function clienteDe(usuarioId) {
  const { rows } = await query('SELECT refresh_token FROM usuarios WHERE id = $1', [usuarioId]);
  const refreshToken = rows[0]?.refresh_token;
  if (!refreshToken) throw reconectar();

  const oauth = new auth.OAuth2(config.google.clientId, config.google.clientSecret, config.google.redirectUri);
  oauth.setCredentials({ refresh_token: refreshToken });
  return crearClassroom({ version: 'v1', auth: oauth });
}

// Recorre todas las páginas de una lista de Classroom.
async function todasLasPaginas(pedir, campo) {
  const resultado = [];
  let pageToken;
  do {
    const { data } = await pedir({ pageToken, pageSize: 100 });
    resultado.push(...(data[campo] ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return resultado;
}

// Ejecuta fn con el cliente del usuario y traduce cualquier error de Google.
async function conClassroom(usuarioId, fn) {
  try {
    return await fn(await clienteDe(usuarioId));
  } catch (err) {
    throw traducirError(err);
  }
}

// --- Formato de respuesta ---

function aCurso(c) {
  return {
    id: c.id,
    nombre: c.name,
    seccion: c.section ?? null,
    descripcion: c.descriptionHeading ?? c.description ?? null,
    salon: c.room ?? null,
    enlace: c.alternateLink,
  };
}

// Classroom da la fecha y la hora de entrega por separado y en UTC.
export function fechaEntrega(dueDate, dueTime) {
  if (!dueDate) return null;
  const { year, month, day } = dueDate;
  const { hours = 0, minutes = 0 } = dueTime ?? {};
  return new Date(Date.UTC(year, month - 1, day, hours, minutes)).toISOString();
}

const ESTADOS_ENTREGADA = new Set(['TURNED_IN', 'RETURNED']);

function aTarea(t, curso, entrega) {
  return {
    id: t.id,
    cursoId: t.courseId,
    curso: curso?.name ?? null,
    titulo: t.title,
    instrucciones: t.description ?? '',
    tipo: t.workType, // ASSIGNMENT, SHORT_ANSWER_QUESTION, MULTIPLE_CHOICE_QUESTION
    puntos: t.maxPoints ?? null,
    fechaEntrega: fechaEntrega(t.dueDate, t.dueTime),
    materiales: (t.materials ?? []).map(aMaterial).filter(Boolean),
    enlace: t.alternateLink,
    estado: entrega?.state ?? null, // NEW, CREATED, TURNED_IN, RETURNED, RECLAIMED_BY_STUDENT
    entregada: ESTADOS_ENTREGADA.has(entrega?.state),
    tarde: entrega?.late ?? false,
  };
}

function aMaterial(m) {
  if (m.driveFile) return { tipo: 'drive', titulo: m.driveFile.driveFile?.title, enlace: m.driveFile.driveFile?.alternateLink };
  if (m.link) return { tipo: 'enlace', titulo: m.link.title ?? m.link.url, enlace: m.link.url };
  if (m.youtubeVideo) return { tipo: 'youtube', titulo: m.youtubeVideo.title, enlace: m.youtubeVideo.alternateLink };
  if (m.form) return { tipo: 'formulario', titulo: m.form.title, enlace: m.form.formUrl };
  return null;
}

// --- Consultas ---

function listarCursosActivos(cr) {
  return todasLasPaginas(
    (p) => cr.courses.list({ ...p, studentId: 'me', courseStates: ['ACTIVE'] }),
    'courses',
  );
}

async function tareasDeCurso(cr, curso) {
  const [tareas, entregas] = await Promise.all([
    todasLasPaginas(
      (p) => cr.courses.courseWork.list({ ...p, courseId: curso.id, courseWorkStates: ['PUBLISHED'] }),
      'courseWork',
    ),
    // '-' = las entregas del alumno en todas las tareas del curso, en una sola consulta.
    todasLasPaginas(
      (p) => cr.courses.courseWork.studentSubmissions.list({ ...p, courseId: curso.id, courseWorkId: '-', userId: 'me' }),
      'studentSubmissions',
    ),
  ]);
  const entregaPorTarea = new Map(entregas.map((e) => [e.courseWorkId, e]));
  return tareas.map((t) => aTarea(t, curso, entregaPorTarea.get(t.id)));
}

// Más próximas primero; las que no tienen fecha, al final.
function porFecha(a, b) {
  if (!a.fechaEntrega) return b.fechaEntrega ? 1 : 0;
  if (!b.fechaEntrega) return -1;
  return a.fechaEntrega.localeCompare(b.fechaEntrega);
}

export function listarClases(usuarioId) {
  return conClassroom(usuarioId, async (cr) => (await listarCursosActivos(cr)).map(aCurso));
}

export function obtenerClase(usuarioId, cursoId) {
  return conClassroom(usuarioId, async (cr) => {
    const [{ data: curso }, maestros] = await Promise.all([
      cr.courses.get({ id: cursoId }),
      todasLasPaginas((p) => cr.courses.teachers.list({ ...p, courseId: cursoId }), 'teachers'),
    ]);
    return {
      ...aCurso(curso),
      maestros: maestros.map((m) => ({ id: m.userId, nombre: m.profile?.name?.fullName ?? 'Sin nombre' })),
    };
  });
}

export function listarTareas(usuarioId, cursoId) {
  return conClassroom(usuarioId, async (cr) => {
    const { data: curso } = await cr.courses.get({ id: cursoId });
    return (await tareasDeCurso(cr, curso)).sort(porFecha);
  });
}

export function obtenerTarea(usuarioId, cursoId, tareaId) {
  return conClassroom(usuarioId, async (cr) => {
    const [{ data: curso }, { data: tarea }, entregas] = await Promise.all([
      cr.courses.get({ id: cursoId }),
      cr.courses.courseWork.get({ courseId: cursoId, id: tareaId }),
      todasLasPaginas(
        (p) => cr.courses.courseWork.studentSubmissions.list({ ...p, courseId: cursoId, courseWorkId: tareaId, userId: 'me' }),
        'studentSubmissions',
      ),
    ]);
    return aTarea(tarea, curso, entregas[0]);
  });
}

// Tareas con fecha de entrega que aún no se entregan, de todas las clases.
export function listarPendientes(usuarioId, log) {
  return conClassroom(usuarioId, async (cr) => {
    const cursos = await listarCursosActivos(cr);
    const resultados = await Promise.allSettled(cursos.map((c) => tareasDeCurso(cr, c)));

    const tareas = [];
    resultados.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        tareas.push(...r.value);
        return;
      }
      const err = traducirError(r.reason);
      // Si el token venció, fallan todas: se avisa en vez de mostrar un calendario vacío.
      if (err.codigo === 'reconectar') throw err;
      log.warn({ err: r.reason, cursoId: cursos[i].id }, 'No se pudieron leer las tareas de un curso');
    });

    return tareas.filter((t) => t.fechaEntrega && !t.entregada).sort(porFecha);
  });
}
