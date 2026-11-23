import { crearApp } from './app.js';
import { config } from './config.js';
import { crearTablas, pool } from './db.js';

const app = await crearApp({ logger: true });
app.addHook('onClose', () => pool.end());

try {
  await crearTablas();
  await app.listen({ port: config.port, host: config.host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
