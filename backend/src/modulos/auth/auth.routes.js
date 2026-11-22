import oauth2 from '@fastify/oauth2';
import { config } from '../../config.js';
import { guardarUsuario, obtenerPerfilGoogle, obtenerUsuario } from './auth.service.js';

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly', // maestros del curso
];

export default async function authRoutes(app) {
  // Registra GET /auth/google, que redirige a la pantalla de Google.
  await app.register(oauth2, {
    name: 'googleOAuth2',
    scope: SCOPES,
    credentials: {
      client: { id: config.google.clientId, secret: config.google.clientSecret },
      auth: oauth2.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: '/auth/google',
    callbackUri: config.google.redirectUri,
    // offline + consent: Google entrega el refresh token para usar Classroom después.
    callbackUriParams: { access_type: 'offline', prompt: 'consent' },
    pkce: 'S256',
    cookie: { path: '/', sameSite: 'lax', secure: config.esProduccion },
  });

  app.get('/auth/callback', async (request, reply) => {
    try {
      const { token } = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request, reply);
      const perfil = await obtenerPerfilGoogle(token.access_token);
      const usuarioId = await guardarUsuario(perfil, token.refresh_token);
      request.session.set('usuarioId', usuarioId);
      return reply.redirect('/');
    } catch (err) {
      request.log.error(err, 'Falló el inicio de sesión con Google');
      return reply.redirect('/login?error=1');
    }
  });

  app.post('/auth/logout', async (request, reply) => {
    request.session.delete();
    return reply.send({ ok: true });
  });

  app.get('/api/yo', { preHandler: app.requireAuth }, async (request, reply) => {
    const usuario = await obtenerUsuario(request.usuarioId);
    if (!usuario) {
      request.session.delete();
      return reply.code(401).send({ error: 'No has iniciado sesión' });
    }
    return usuario;
  });
}
