# Bitácora de Garabato

Registro corto de lo que se hizo en cada iteración del proyecto.

---

## Iteración 1 — Fase 0: Preparación (21 nov 2026)

**Backend**
- Se inicializó `backend/` con `"type": "module"`, `fastify` y `dotenv`.
- `src/config.js` lee `PORT` y `HOST` del `.env`; se agregó `.env.example`.
- `src/server.js` levanta Fastify con la ruta `GET /api/salud` → `{ ok: true }`.
- Scripts: `npm run dev` (con recarga) y `npm start`.

**Frontend**
- Se creó `frontend/` con Vite + React y se instaló `react-router-dom`.
- Proxy en `vite.config.js`: `/api` y `/auth` → `http://localhost:3000`.
- `App.jsx` muestra la respuesta de `/api/salud` para comprobar la conexión.
- Carpetas `paginas/`, `componentes/` y `utils/` listas según el roadmap.

**General**
- `.gitignore` en la raíz (ignora `node_modules`, `dist` y `.env`).
- Sección "Correr localmente" en el `README.md`.

**Resultado:** el frontend muestra el `{ ok: true }` del backend. ✅

**Pendiente (manual):** crear las bases `dev` y `prod` en Neon; en Google Cloud activar la Classroom API, configurar la pantalla de consentimiento (Testing) con los correos de prueba y crear las credenciales OAuth con la redirección `http://localhost:5173/auth/callback`.
