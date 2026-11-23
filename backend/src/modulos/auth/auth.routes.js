import oauth2 from '@fastify/oauth2';
import { config } from '../../config.js';
import { guardarColores, guardarMaterias, guardarUsuario, obtenerPerfilGoogle, obtenerUsuario } from './auth.service.js';

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

  // Materias que se muestran en la app. Un arreglo vacío es válido (no ver ninguna).
  app.put('/api/yo/materias', {
    preHandler: app.requireAuth,
    schema: {
      body: {
        type: 'object',
        required: ['materias'],
        additionalProperties: false,
        properties: {
          materias: { type: 'array', maxItems: 200, items: { type: 'string', minLength: 1, maxLength: 100 } },
        },
      },
    },
  }, async (request) => ({ materias: await guardarMaterias(request.usuarioId, request.body.materias) }));

  // Colores del editor: { clave: "#rrggbb" | null }. Las claves son las de la
  // paleta del frontend (paleta-markdown.json); aquí solo se valida la forma.
  app.put('/api/yo/colores', {
    preHandler: app.requireAuth,
    schema: {
      body: {
        type: 'object',
        required: ['colores'],
        additionalProperties: false,
        properties: {
          colores: {
            type: 'object',
            maxProperties: 30,
            propertyNames: { type: 'string', pattern: '^[a-z][a-z0-9]{0,29}$' },
            additionalProperties: {
              anyOf: [{ type: 'string', pattern: '^#[0-9a-fA-F]{6}$' }, { type: 'null' }],
            },
          },
        },
      },
    },
  }, async (request) => ({ colores: await guardarColores(request.usuarioId, request.body.colores) }));
}
