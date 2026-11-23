import {
  actualizarHorario,
  crearHorario,
  eliminarHorario,
  ErrorHorario,
  listarHorarios,
  reemplazarHorarios,
} from './horarios.service.js';

// Hora en formato 24 h, "HH:MM".
const hora = { type: 'string', pattern: '^([01][0-9]|2[0-3]):[0-5][0-9]$' };

const campos = {
  cursoId: { type: 'string', minLength: 1, maxLength: 100 },
  dia: { type: 'integer', minimum: 0, maximum: 6 }, // 0 = domingo
  horaInicio: hora,
  horaFin: hora,
};

const conId = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string', pattern: '^[0-9]{1,18}$' } },
  },
};

const noEncontrado = (reply) => reply.code(404).send({ error: 'No se encontró el horario', codigo: 'no_encontrado' });

export default async function horariosRoutes(app) {
  app.addHook('preHandler', app.requireAuth);

  app.setErrorHandler((err, request, reply) => {
    if (err instanceof ErrorHorario) return reply.code(400).send({ error: err.message, codigo: 'horas_invalidas' });
    return reply.send(err);
  });

  app.get('/api/horarios', (request) => listarHorarios(request.usuarioId));

  app.post('/api/horarios', {
    schema: {
      body: { type: 'object', additionalProperties: false, required: Object.keys(campos), properties: campos },
    },
  }, async (request, reply) => reply.code(201).send(await crearHorario(request.usuarioId, request.body)));

  // Guarda la tabla completa de las materias en `cursos` (reemplaza sus bloques).
  app.put('/api/horarios', {
    schema: {
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['cursos', 'bloques'],
        properties: {
          cursos: { type: 'array', maxItems: 200, items: campos.cursoId },
          bloques: {
            type: 'array',
            maxItems: 500,
            items: { type: 'object', additionalProperties: false, required: Object.keys(campos), properties: campos },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { cursos, bloques } = request.body;
    if (bloques.some((b) => !cursos.includes(b.cursoId))) {
      return reply.code(400).send({ error: 'Hay bloques de una materia que no está en la lista', codigo: 'curso_invalido' });
    }
    return reemplazarHorarios(request.usuarioId, cursos, bloques);
  });

  app.patch('/api/horarios/:id', {
    schema: { ...conId, body: { type: 'object', additionalProperties: false, properties: campos } },
  }, async (request, reply) => {
    const horario = await actualizarHorario(request.usuarioId, request.params.id, request.body ?? {});
    return horario ?? noEncontrado(reply);
  });

  app.delete('/api/horarios/:id', { schema: conId }, async (request, reply) => {
    const eliminado = await eliminarHorario(request.usuarioId, request.params.id);
    return eliminado ? reply.code(204).send() : noEncontrado(reply);
  });
}
