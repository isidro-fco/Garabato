import {
  ErrorClassroom,
  listarClases,
  listarPendientes,
  listarTareas,
  obtenerClase,
  obtenerTarea,
} from './classroom.service.js';

export default async function classroomRoutes(app) {
  app.addHook('preHandler', app.requireAuth);

  // Solo afecta a las rutas de este módulo.
  app.setErrorHandler((err, request, reply) => {
    if (err instanceof ErrorClassroom) {
      if (err.status >= 500) request.log.warn(err);
      return reply.code(err.status).send({ error: err.message, codigo: err.codigo });
    }
    request.log.error(err);
    return reply.code(502).send({ error: 'No se pudo consultar Google Classroom', codigo: 'classroom' });
  });

  app.get('/api/clases', (request) => listarClases(request.usuarioId));

  app.get('/api/clases/:id', (request) => obtenerClase(request.usuarioId, request.params.id));

  app.get('/api/clases/:id/tareas', (request) => listarTareas(request.usuarioId, request.params.id));

  app.get('/api/clases/:id/tareas/:tareaId', (request) =>
    obtenerTarea(request.usuarioId, request.params.id, request.params.tareaId));

  app.get('/api/tareas/pendientes', (request) => listarPendientes(request.usuarioId, request.log));
}
