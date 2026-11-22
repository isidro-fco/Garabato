import Fastify from 'fastify';
import { config } from './config.js';
import { crearTablas, pool } from './db.js';
import auth from './plugins/auth.js';
import authRoutes from './modulos/auth/auth.routes.js';
import classroomRoutes from './modulos/classroom/classroom.routes.js';
import documentosRoutes from './modulos/documentos/documentos.routes.js';
import horariosRoutes from './modulos/horarios/horarios.routes.js';

// trustProxy: en producción las peticiones llegan a través de Vercel y Render.
const app = Fastify({
  logger: true,
  trustProxy: true,
  // Por defecto Fastify borra en silencio los campos que no están en el esquema.
  // Así, un campo desconocido responde 400 (additionalProperties: false).
  ajv: { customOptions: { removeAdditional: false } },
});

await app.register(auth);
await app.register(authRoutes);
await app.register(classroomRoutes);
await app.register(documentosRoutes);
await app.register(horariosRoutes);

app.get('/api/salud', async () => ({ ok: true }));

app.addHook('onClose', () => pool.end());

try {
  await crearTablas();
  await app.listen({ port: config.port, host: config.host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
