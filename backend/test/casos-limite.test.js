// Pruebas de casos límite del backend contra la base del .env (dev).
// Crea usuarios temporales y los borra al terminar. Classroom se simula para
// controlar su respuesta (incluido que falle).
//   npm test
import assert from 'node:assert/strict';
import { after, before, describe, mock, test } from 'node:test';

// --- Classroom simulado ---
class ErrorClassroom extends Error {
  constructor(status, codigo, mensaje) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
  }
}
const classroom = { clases: [], falla: null };
mock.module('../src/modulos/classroom/classroom.service.js', {
  namedExports: {
    ErrorClassroom,
    listarClases: async () => {
      if (classroom.falla) throw classroom.falla;
      return classroom.clases;
    },
    // Las demás rutas de Classroom no se prueban aquí.
    obtenerClase: async () => ({}),
    listarTareas: async () => [],
    obtenerTarea: async () => ({}),
    listarPendientes: async () => [],
  },
});

const { crearApp } = await import('../src/app.js');
const { crearTablas, pool, query } = await import('../src/db.js');

const sufijo = `${Date.now()}`;
const A = `prueba-a-${sufijo}`;
const B = `prueba-b-${sufijo}`;
let app;
const cookies = {};

// Petición como el usuario indicado (null = sin sesión).
async function pedir(usuario, method, url, payload, headers = {}) {
  const res = await app.inject({
    method,
    url,
    payload,
    headers: { ...(usuario ? { cookie: cookies[usuario] } : {}), ...headers },
  });
  let json = null;
  try {
    json = res.json();
  } catch {}
  return { status: res.statusCode, json, body: res.body };
}

before(async () => {
  app = await crearApp();
  // Solo en pruebas: inicia sesión sin pasar por Google.
  app.get('/__sesion/:id', (request) => {
    request.session.set('usuarioId', request.params.id);
    return { ok: true };
  });
  await crearTablas();
  for (const id of [A, B]) {
    await query('INSERT INTO usuarios (id, nombre, correo) VALUES ($1, $2, $3)', [id, 'Prueba', `${id}@ejemplo.test`]);
    const res = await app.inject({ method: 'GET', url: `/__sesion/${id}` });
    cookies[id] = res.headers['set-cookie'].split(';')[0];
  }
});

after(async () => {
  await query('DELETE FROM usuarios WHERE id = ANY($1)', [[A, B]]);
  await app.close();
  await pool.end();
});

describe('Sesión', () => {
  test('sin sesión, las rutas privadas responden 401', async () => {
    for (const [m, url] of [['GET', '/api/yo'], ['GET', '/api/documentos'], ['GET', '/api/horarios'], ['GET', '/api/materias-propias'], ['POST', '/api/materias-propias']]) {
      assert.equal((await pedir(null, m, url, m === 'POST' ? { nombre: 'x' } : undefined)).status, 401, `${m} ${url}`);
    }
  });

  test('cookie alterada → 401, no error 500', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/yo', headers: { cookie: 'garabato_sesion=basura%3Babc' } });
    assert.equal(res.statusCode, 401);
  });

  test('sesión de un usuario que ya no existe → 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/__sesion/fantasma-no-existe' });
    const r = await app.inject({ method: 'GET', url: '/api/yo', headers: { cookie: res.headers['set-cookie'].split(';')[0] } });
    assert.equal(r.statusCode, 401);
  });
});

describe('Documentos', () => {
  test('crear sin datos usa valores por defecto', async () => {
    const r = await pedir(A, 'POST', '/api/documentos', {});
    assert.equal(r.status, 201);
    assert.equal(r.json.titulo, 'Sin título');
    assert.equal(r.json.contenido, '');
  });

  test('título de 200 letras sí, de 201 no', async () => {
    assert.equal((await pedir(A, 'POST', '/api/documentos', { titulo: 'a'.repeat(200) })).status, 201);
    assert.equal((await pedir(A, 'POST', '/api/documentos', { titulo: 'a'.repeat(201) })).status, 400);
  });

  test('datos inválidos → 400 con mensaje en español (sin detalles internos)', async () => {
    const r = await pedir(A, 'POST', '/api/documentos', { titulo: 5 });
    assert.equal(r.status, 400);
    assert.deepEqual(r.json, { error: 'Los datos enviados no son válidos.', codigo: 'datos_invalidos' });
    const h = await pedir(A, 'PUT', '/api/horarios', { cursos: [], bloques: [{ dia: 9 }] });
    assert.equal(h.json.codigo, 'datos_invalidos');
  });

  test('tipos equivocados y campos desconocidos → 400', async () => {
    assert.equal((await pedir(A, 'POST', '/api/documentos', { titulo: 123 })).status, 400);
    assert.equal((await pedir(A, 'POST', '/api/documentos', { contenido: ['x'] })).status, 400);
    assert.equal((await pedir(A, 'POST', '/api/documentos', { hackeado: true })).status, 400);
  });

  test('JSON mal formado → 400', async () => {
    const r = await pedir(A, 'POST', '/api/documentos', '{"titulo": ', { 'content-type': 'application/json' });
    assert.equal(r.status, 400);
  });

  test('ids inválidos o inexistentes → 404 con mensaje en español', async () => {
    for (const id of ['-1', 'abc', '1.5', '9'.repeat(19)]) {
      const r = await pedir(A, 'GET', `/api/documentos/${id}`);
      assert.equal(r.status, 404, id);
      assert.equal(r.json.codigo, 'no_encontrado');
    }
    assert.equal((await pedir(A, 'GET', '/api/documentos/999999999999')).status, 404);
  });

  test('un usuario no puede ver, editar ni borrar el documento de otro', async () => {
    const { json: doc } = await pedir(A, 'POST', '/api/documentos', { titulo: 'Privado' });
    assert.equal((await pedir(B, 'GET', `/api/documentos/${doc.id}`)).status, 404);
    assert.equal((await pedir(B, 'PATCH', `/api/documentos/${doc.id}`, { titulo: 'X' })).status, 404);
    assert.equal((await pedir(B, 'DELETE', `/api/documentos/${doc.id}`)).status, 404);
    assert.equal((await pedir(A, 'GET', `/api/documentos/${doc.id}`)).json.titulo, 'Privado');
  });

  test('emojis, acentos y HTML se guardan tal cual', async () => {
    const texto = '# Título ñ 🎉\n<script>alert(1)</script>\n\u0000?';
    const r = await pedir(A, 'POST', '/api/documentos', { contenido: texto.replace('\u0000', '') });
    assert.equal(r.status, 201);
    assert.equal((await pedir(A, 'GET', `/api/documentos/${r.json.id}`)).json.contenido, texto.replace('\u0000', ''));
  });

  test('carácter nulo (\\u0000, p. ej. pegado de un PDF) se quita y el documento se guarda', async () => {
    const r = await pedir(A, 'POST', '/api/documentos', { titulo: 'x\u0000y', contenido: 'a\u0000b', opciones: { n: 'c\u0000d' } });
    assert.equal(r.status, 201, r.body);
    assert.equal(r.json.contenido, 'ab');
    assert.equal(r.json.titulo, 'xy');
  });

  test('documento de más de 4 MB → 413', async () => {
    const r = await pedir(A, 'POST', '/api/documentos', { contenido: 'a'.repeat(4.5 * 1024 * 1024) });
    assert.equal(r.status, 413);
  });

  test('guardar dos veces a la vez el mismo documento deja el último', async () => {
    const { json: doc } = await pedir(A, 'POST', '/api/documentos', {});
    await Promise.all([1, 2, 3].map((n) => pedir(A, 'PATCH', `/api/documentos/${doc.id}`, { contenido: `v${n}` })));
    const final = (await pedir(A, 'GET', `/api/documentos/${doc.id}`)).json.contenido;
    assert.match(final, /^v[123]$/);
  });

  test('filtro por un curso que no existe → lista vacía', async () => {
    const r = await pedir(A, 'GET', '/api/documentos?cursoId=no-existe');
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, []);
  });

  test('borrar dos veces → 204 y luego 404', async () => {
    const { json: doc } = await pedir(A, 'POST', '/api/documentos', {});
    assert.equal((await pedir(A, 'DELETE', `/api/documentos/${doc.id}`)).status, 204);
    assert.equal((await pedir(A, 'DELETE', `/api/documentos/${doc.id}`)).status, 404);
  });
});

describe('Horario', () => {
  const bloque = (extra = {}) => ({ cursoId: 'c1', dia: 1, horaInicio: '07:00', horaFin: '08:00', ...extra });
  const put = (u, bloques, cursos = ['c1']) => pedir(u, 'PUT', '/api/horarios', { cursos, bloques });

  test('usuario nuevo: horario vacío', async () => {
    assert.deepEqual((await pedir(B, 'GET', '/api/horarios')).json, []);
  });

  test('días y horas fuera de rango → 400', async () => {
    for (const extra of [{ dia: 7 }, { dia: -1 }, { dia: 1.5 }, { dia: '1' }, { horaInicio: '24:00' }, { horaInicio: '7:00' }, { horaFin: '08:60' }, { horaInicio: '' }]) {
      assert.equal((await put(A, [bloque(extra)])).status, 400, JSON.stringify(extra));
    }
  });

  test('fin antes o igual que inicio → 400 con mensaje claro', async () => {
    for (const horaFin of ['06:00', '07:00']) {
      const r = await put(A, [bloque({ horaFin })]);
      assert.equal(r.status, 400);
      assert.equal(r.json.codigo, 'horas_invalidas');
    }
  });

  test('bloque de una materia fuera de la lista → 400', async () => {
    assert.equal((await put(A, [bloque({ cursoId: 'otra' })])).status, 400);
  });

  test('más de 500 bloques → 400', async () => {
    assert.equal((await put(A, Array.from({ length: 501 }, () => bloque()))).status, 400);
  });

  test('guardar varias veces seguidas (doble clic / dos pestañas) no duplica bloques', async () => {
    const bloques = [bloque(), bloque({ dia: 2 })];
    await Promise.all(Array.from({ length: 5 }, () => put(A, bloques)));
    const r = await pedir(A, 'GET', '/api/horarios');
    assert.equal(r.json.filter((h) => h.cursoId === 'c1').length, 2);
  });

  test('guardar una lista vacía borra solo las materias indicadas', async () => {
    await put(A, [bloque({ cursoId: 'c2' })], ['c2']);
    await put(A, [], ['c1']);
    const r = await pedir(A, 'GET', '/api/horarios');
    assert.deepEqual(r.json.map((h) => h.cursoId), ['c2']);
  });

  test('el horario de un usuario no toca el de otro', async () => {
    await put(B, [bloque()]);
    await put(A, [], ['c1']);
    assert.equal((await pedir(B, 'GET', '/api/horarios')).json.length, 1);
  });
});

describe('Materias sin Classroom', () => {
  const crear = (u, nombre) => pedir(u, 'POST', '/api/materias-propias', { nombre });

  test('usuario nuevo: lista vacía', async () => {
    classroom.clases = [];
    assert.deepEqual((await pedir(B, 'GET', '/api/materias-propias')).json, []);
  });

  test('nombre vacío, solo espacios, sin campo o que no es texto → 400', async () => {
    for (const nombre of ['', '   ', '\n\t', 42, null]) {
      assert.equal((await crear(A, nombre)).status, 400, JSON.stringify(nombre));
    }
    assert.equal((await pedir(A, 'POST', '/api/materias-propias', {})).status, 400);
  });

  test('nombre de 80 letras sí, de 81 (o 200) no', async () => {
    assert.equal((await crear(A, 'm'.repeat(80))).status, 201);
    assert.equal((await crear(A, 'n'.repeat(81))).status, 400);
    assert.equal((await crear(A, 'n'.repeat(200))).status, 400);
  });

  test('se guarda sin espacios de más', async () => {
    const r = await crear(A, '  Taller   de  lectura ');
    assert.equal(r.status, 201);
    assert.equal(r.json.nombre, 'Taller de lectura');
  });

  test('mismo nombre que una clase de Classroom (con o sin acentos / mayúsculas) → 409', async () => {
    classroom.clases = [{ id: '111', nombre: 'Cálculo Integral' }];
    for (const nombre of ['Cálculo Integral', 'calculo integral', 'CÁLCULO   INTEGRAL']) {
      const r = await crear(A, nombre);
      assert.equal(r.status, 409, nombre);
      assert.equal(r.json.codigo, 'materia_repetida');
    }
  });

  test('mismo nombre que otra materia propia → 409', async () => {
    assert.equal((await crear(A, 'Educación Física')).status, 201);
    assert.equal((await crear(A, 'educacion fisica')).status, 409);
  });

  test('otro usuario sí puede usar el mismo nombre', async () => {
    assert.equal((await crear(B, 'Educación Física')).status, 201);
  });

  test('doble clic en Agregar: solo se crea una', async () => {
    const respuestas = await Promise.all([crear(A, 'Inglés'), crear(A, 'Inglés'), crear(A, 'inglés')]);
    const estados = respuestas.map((r) => r.status).sort();
    assert.equal(estados.filter((s) => s === 201).length, 1, `estados: ${estados}`);
    assert.ok(estados.every((s) => s === 201 || s === 409), `estados: ${estados}`);
    const lista = (await pedir(A, 'GET', '/api/materias-propias')).json;
    assert.equal(lista.filter((m) => m.nombre.toLowerCase() === 'inglés').length, 1);
  });

  test('si Classroom falla, no se agrega y el error es claro', async () => {
    classroom.falla = new ErrorClassroom(401, 'reconectar', 'Tu conexión con Google venció. Vuelve a iniciar sesión.');
    const r = await crear(A, 'Materia nueva');
    classroom.falla = null;
    assert.equal(r.status, 401);
    assert.equal(r.json.codigo, 'reconectar');
  });

  test('borrar una materia borra también sus horas', async () => {
    const { json: m } = await crear(A, 'Con horas');
    await pedir(A, 'PUT', '/api/horarios', { cursos: [m.id], bloques: [{ cursoId: m.id, dia: 3, horaInicio: '10:00', horaFin: '11:00' }] });
    const id = m.id.replace('propia-', '');
    assert.equal((await pedir(A, 'DELETE', `/api/materias-propias/${id}`)).status, 204);
    assert.ok(!(await pedir(A, 'GET', '/api/horarios')).json.some((h) => h.cursoId === m.id));
    assert.equal((await pedir(A, 'DELETE', `/api/materias-propias/${id}`)).status, 404);
  });

  test('no se puede borrar la materia de otro usuario', async () => {
    const { json: m } = await crear(B, 'De B');
    assert.equal((await pedir(A, 'DELETE', `/api/materias-propias/${m.id.replace('propia-', '')}`)).status, 404);
    assert.ok((await pedir(B, 'GET', '/api/materias-propias')).json.some((x) => x.id === m.id));
  });

  test('id inválido al borrar → 404', async () => {
    for (const id of ['abc', '-3', 'propia-1']) {
      assert.equal((await pedir(A, 'DELETE', `/api/materias-propias/${id}`)).status, 404, id);
    }
  });
});

describe('Preferencias', () => {
  test('materias: lista vacía es válida y los repetidos se quitan', async () => {
    assert.deepEqual((await pedir(A, 'PUT', '/api/yo/materias', { materias: [] })).json.materias, []);
    assert.deepEqual((await pedir(A, 'PUT', '/api/yo/materias', { materias: ['1', '1', '2'] })).json.materias, ['1', '2']);
    assert.equal((await pedir(A, 'PUT', '/api/yo/materias', { materias: [''] })).status, 400);
    assert.equal((await pedir(A, 'PUT', '/api/yo/materias', { materias: Array.from({ length: 201 }, (_, i) => `${i}`) })).status, 400);
  });

  test('colores: solo #rrggbb; null vuelve al predeterminado', async () => {
    assert.equal((await pedir(A, 'PUT', '/api/yo/colores', { colores: { titulo1: 'red' } })).status, 400);
    assert.equal((await pedir(A, 'PUT', '/api/yo/colores', { colores: { titulo1: '#12345' } })).status, 400);
    assert.equal((await pedir(A, 'PUT', '/api/yo/colores', { colores: { 'Mala-Clave': '#123456' } })).status, 400);
    assert.deepEqual((await pedir(A, 'PUT', '/api/yo/colores', { colores: { titulo1: '#123456', negrita: null } })).json.colores, { titulo1: '#123456' });
    assert.deepEqual((await pedir(A, 'PUT', '/api/yo/colores', { colores: { titulo1: '#123456', grises: true } })).json.colores, { titulo1: '#123456', grises: true });
    assert.deepEqual((await pedir(A, 'PUT', '/api/yo/colores', { colores: { titulo1: '#123456', grises: false } })).json.colores, { titulo1: '#123456' });
  });
});
