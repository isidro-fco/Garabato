import fp from 'fastify-plugin';
import secureSession from '@fastify/secure-session';
import { config } from '../config.js';

async function auth(app) {
  // Cookie cifrada con la sesión; solo guarda el id del usuario.
  await app.register(secureSession, {
    key: Buffer.from(config.sessionSecret, 'base64'),
    cookieName: 'garabato_sesion',
    cookie: {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: config.esProduccion,
      maxAge: 60 * 60 * 24 * 30, // 30 días
    },
  });

  // preHandler para rutas privadas: { preHandler: app.requireAuth }
  app.decorate('requireAuth', async (request, reply) => {
    const usuarioId = request.session.get('usuarioId');
    if (!usuarioId) {
      return reply.code(401).send({ error: 'No has iniciado sesión' });
    }
    request.usuarioId = usuarioId;
  });
}

export default fp(auth, { name: 'auth' });
