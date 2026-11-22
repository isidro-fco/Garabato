import Fastify from 'fastify';
import { config } from './config.js';
import { crearTablas, pool } from './db.js';
import auth from './plugins/auth.js';
import authRoutes from './modulos/auth/auth.routes.js';

// trustProxy: en producción las peticiones llegan a través de Vercel y Render.
const app = Fastify({ logger: true, trustProxy: true });

await app.register(auth);
await app.register(authRoutes);

app.get('/api/salud', async () => ({ ok: true }));

app.addHook('onClose', () => pool.end());

try {
  await crearTablas();
  await app.listen({ port: config.port, host: config.host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
