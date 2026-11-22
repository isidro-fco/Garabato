import 'dotenv/config';

function requerida(nombre) {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre} (revisa backend/.env)`);
  }
  return valor;
}

const esProduccion = process.env.NODE_ENV === 'production';

export const config = {
  esProduccion,
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: requerida('DATABASE_URL'),
  sessionSecret: requerida('SESSION_SECRET'),
  google: {
    clientId: requerida('GOOGLE_CLIENT_ID'),
    clientSecret: requerida('GOOGLE_CLIENT_SECRET'),
    redirectUri: requerida('GOOGLE_REDIRECT_URI'),
  },
};
