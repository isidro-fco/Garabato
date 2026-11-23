import Fastify from 'fastify';
import auth from './plugins/auth.js';
import authRoutes from './modulos/auth/auth.routes.js';
import classroomRoutes from './modulos/classroom/classroom.routes.js';
import documentosRoutes from './modulos/documentos/documentos.routes.js';
import horariosRoutes from './modulos/horarios/horarios.routes.js';

// Postgres no acepta el carácter nulo (\u0000) en textos ni en JSON. Puede
// llegar al pegar texto copiado de un PDF; se quita antes de validar.
function sinNulos(valor) {
  if (typeof valor === 'string') return valor.includes('\u0000') ? valor.replaceAll('\u0000', '') : valor;
  if (Array.isArray(valor)) return valor.map(sinNulos);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [sinNulos(k), sinNulos(v)]));
  }
  return valor;
}

// Arma la app con todas sus rutas. La usan server.js y las pruebas.
// opciones: las de Fastify (por ejemplo, logger).
export async function crearApp(opciones = {}) {
  const app = Fastify({
    // trustProxy: en producción las peticiones llegan a través de Vercel y Render.
    trustProxy: true,
    ajv: {
      customOptions: {
        // Por defecto Fastify borra en silencio los campos que no están en el
        // esquema. Así, un campo desconocido responde 400 (additionalProperties: false).
        removeAdditional: false,
        // Tampoco convierte tipos: un número donde va texto (o "1" donde va un
        // número) es un error, no se guarda convertido.
        coerceTypes: false,
      },
    },
    ...opciones,
  });

  app.addHook('preValidation', async (request) => {
    if (request.body && typeof request.body === 'object') request.body = sinNulos(request.body);
  });

  // Errores que no manejó ningún módulo: los 4xx se responden tal cual; los
  // 500 se registran y se responden sin detalles internos.
  app.setErrorHandler((err, request, reply) => {
    if (err.validation) {
      // Un id con formato inválido en la URL (p. ej. /api/documentos/abc) no existe.
      if (err.validationContext === 'params') return reply.code(404).send({ error: 'No se encontró. Revisa el enlace.', codigo: 'no_encontrado' });
      request.log.info({ validacion: err.message }, 'datos inválidos');
      return reply.code(400).send({ error: 'Los datos enviados no son válidos.', codigo: 'datos_invalidos' });
    }
    const status = err.statusCode ?? 500;
    if (status < 500) return reply.code(status).send({ error: err.message, codigo: err.code ?? 'solicitud_invalida' });
    request.log.error(err);
    return reply.code(500).send({ error: 'Ocurrió un error en el servidor. Intenta de nuevo.', codigo: 'servidor' });
  });

  await app.register(auth);
  await app.register(authRoutes);
  await app.register(classroomRoutes);
  await app.register(documentosRoutes);
  await app.register(horariosRoutes);

  app.get('/api/health', async () => ({ ok: true }));
  return app;
}
