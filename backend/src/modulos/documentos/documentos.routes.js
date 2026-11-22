import {
  actualizarDocumento,
  crearDocumento,
  eliminarDocumento,
  listarDocumentos,
  obtenerDocumento,
} from './documentos.service.js';

const idClassroom = { type: ['string', 'null'], maxLength: 100 };

const campos = {
  titulo: { type: 'string', maxLength: 200 },
  contenido: { type: 'string', maxLength: 1_000_000 },
  opciones: { type: 'object' },
  cursoId: idClassroom,
  tareaId: idClassroom,
};

const conId = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string', pattern: '^[0-9]{1,18}$' } },
  },
};

const cuerpo = { type: 'object', additionalProperties: false, properties: campos };

// Fastify acepta 1 MB por defecto; un documento largo con acentos puede pasarse.
const LIMITE_CUERPO = 4 * 1024 * 1024;

const noEncontrado = (reply) => reply.code(404).send({ error: 'No se encontró el documento', codigo: 'no_encontrado' });

export default async function documentosRoutes(app) {
  app.addHook('preHandler', app.requireAuth);

  // ?cursoId= y ?tareaId= filtran, por ejemplo los documentos de una tarea.
  app.get('/api/documentos', {
    schema: {
      querystring: {
        type: 'object',
        properties: { cursoId: { type: 'string' }, tareaId: { type: 'string' } },
      },
    },
  }, (request) => listarDocumentos(request.usuarioId, request.query));

  app.get('/api/documentos/:id', { schema: conId }, async (request, reply) => {
    const doc = await obtenerDocumento(request.usuarioId, request.params.id);
    return doc ?? noEncontrado(reply);
  });

  app.post('/api/documentos', { bodyLimit: LIMITE_CUERPO, schema: { body: cuerpo } }, async (request, reply) => {
    const doc = await crearDocumento(request.usuarioId, request.body ?? {});
    return reply.code(201).send(doc);
  });

  app.patch('/api/documentos/:id', { bodyLimit: LIMITE_CUERPO, schema: { ...conId, body: cuerpo } }, async (request, reply) => {
    const doc = await actualizarDocumento(request.usuarioId, request.params.id, request.body ?? {});
    return doc ?? noEncontrado(reply);
  });

  app.delete('/api/documentos/:id', { schema: conId }, async (request, reply) => {
    const eliminado = await eliminarDocumento(request.usuarioId, request.params.id);
    return eliminado ? reply.code(204).send() : noEncontrado(reply);
  });
}
