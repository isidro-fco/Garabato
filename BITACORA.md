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

**Configuración externa (completada)**
- Repositorio en GitHub (`isidro-fco/Garabato`) con `backend/`, `frontend/`, `.gitignore` y `README.md`.
- Neon: bases `garabato_dev` y `garabato_prod`. El `.env` local usa solo `DATABASE_URL` (dev); la de prod irá en Render.
- Google Cloud: Classroom API, pantalla de consentimiento en Testing y credenciales OAuth con redirección `http://localhost:5173/auth/callback`.
- `backend/.env` con `PORT`, `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_REDIRECT_URI`.

**Fase 0 completa.** ✅

---

## Iteración 2 — Fase 1: Base de datos y autenticación (22 nov 2026)

**Backend**
- `config.js` valida las variables del `.env` y no arranca si falta alguna; `.env.example` actualizado (incluye `SESSION_SECRET`).
- `db.js` con `pg` (`sslmode=verify-full` y `enableChannelBinding` para Neon) y `crearTablas()` con `usuarios`, `documentos` y `horarios`.
- `plugins/auth.js`: sesión con `@fastify/secure-session` (cookie cifrada que guarda solo el id del usuario) y decorador `requireAuth`.
- `modulos/auth/`: `@fastify/oauth2` con Google (PKCE, `access_type=offline` y `prompt=consent` para obtener el refresh token, scopes de Classroom).
- Rutas `/auth/google`, `/auth/callback` (crea o actualiza el usuario y conserva el refresh token), `POST /auth/logout` y `/api/yo`.

**Frontend**
- `api.js` con `obtenerYo`, `cerrarSesion` y la URL de login.
- `Login.jsx` con el botón "Iniciar sesión con Google" y aviso de error.
- `RutaPrivada.jsx` redirige a `/login` si no hay sesión.
- `Inicio.jsx` provisional: nombre, foto, correo y botón de cerrar sesión.

**Resultado:** inicio de sesión con Google funcionando; aparecen nombre y foto y la sesión sigue al recargar. ✅

**Notas:** el refresh token se guarda sin cifrar (revisar antes de producción); `prompt=consent` pide permisos en cada login.

---

## Iteración 3 — Fase 2: Integración con Classroom (22 nov 2026)

**Backend**
- Se usa `@googleapis/classroom` (paquete oficial solo de Classroom, 1.7 MB) en lugar de `googleapis` (246 MB).
- `classroom.service.js` crea el cliente con el refresh token del usuario y recorre todas las páginas de resultados.
- `GET /api/clases`: cursos activos del alumno.
- `GET /api/clases/:id`: información del curso y nombres de los maestros.
- `GET /api/clases/:id/tareas`: tareas con instrucciones, fecha de entrega (ISO en UTC), puntos, materiales y estado de entrega.
- `GET /api/tareas/pendientes`: tareas con fecha y sin entregar de todas las clases; si falla un curso se omite.
- Errores traducidos con `codigo`: `reconectar` (401), `sin_permiso` (403), `no_encontrado` (404), `limite` (503).

**Resultado:** rutas de Classroom listas para el frontend. ✅

---

## Iteración 4 — Fase 3: Navegación y vistas de clases (22 nov 2026)

**Frontend**
- `estilos.css` con estilo minimalista (variables de color, modo oscuro y diseño responsivo).
- `BarraLateral.jsx`: Inicio, Clases, Configuración, usuario y Cerrar sesión; en celular pasa a barra superior.
- `api.js` con todas las llamadas; si la sesión o la conexión con Google vence, regresa al login con un mensaje.
- `Clases.jsx`: tarjetas de materias.
- `Materia.jsx`: información del curso, maestros y mosaicos de tareas separados en "Por entregar" y "Entregadas".
- `MosaicoTarea.jsx` con fecha en hora local y estado (Pendiente, Atrasada, Entregada, Entregada tarde, Sin fecha).
- `Tarea.jsx`: instrucciones, materiales y botón "Crear documento para esta tarea" (abre `/documentos/nuevo?curso=&tarea=`).
- Páginas provisionales: `Editor.jsx` (fase 4) y `Configuracion.jsx` (fase 6).
- Utilidades `useCargar.js` y `tareas.js`; componentes de carga y error en `Estado.jsx`.

**Backend**
- `GET /api/clases/:id/tareas/:tareaId` para la vista de instrucciones.

**Otros**
- Se quitó la línea de coautor de los commits anteriores y se desactivó en `.claude/settings.local.json` (ignorado por git).

**Resultado:** se navega Clases → Materia → Tarea con datos reales. ✅

---

## Iteración 5 — Fase 4: Editor Markdown (22 nov 2026)

**Backend**
- Módulo `documentos/`: `GET /api/documentos` (filtros `cursoId` y `tareaId`), `GET /api/documentos/:id`, `POST`, `PATCH` parcial y `DELETE`.
- Todas las consultas filtran por el usuario de la sesión; límite de 4 MB por petición.

**Frontend**
- `Editor.jsx`: título editable, `textarea` con Markdown y `VistaPrevia.jsx` (`react-markdown` + `remark-gfm`); pestañas en celular.
- `useAutoguardado.js`: guarda 1.5 s después de dejar de escribir, sin guardados simultáneos, reintenta si falla, manda lo pendiente con `keepalive` al cerrar y guarda un respaldo en `localStorage` por si la petición no alcanza a llegar.
- `MisDocumentos.jsx`: lista con materia y última edición, crear y eliminar.
- `VincularTarea.jsx`: vincular, cambiar o quitar la tarea del documento.
- La vista de tarea crea documentos ya vinculados y muestra los existentes.

**Pruebas**
- CRUD contra la base `dev` con usuarios temporales (incluye que un usuario no vea documentos de otro).
- Prueba en Chrome automatizada: un solo guardado por ráfaga de escritura, texto conservado al recargar, vínculos, lista y vista de celular.

**Resultado:** escribes, cierras la pestaña, vuelves y el documento sigue ahí. ✅

---

## Iteración 6 — Fase 5: Personalización y PDF, y migración a shadcn/ui (22 nov 2026)

**Fase 5**
- `OpcionesDocumento.jsx`: portada (título, institución, materia, maestro, alumno, matrícula, fecha y logo), encabezado, pie, numeración (posición y estilo) y formato (hoja, fuente e interlineado). Todo se guarda en `opciones`.
- La portada se llena sola la primera vez con el usuario y la clase vinculada; matrícula, institución y logo se recuerdan en `localStorage`. El logo se reduce a 600 px.
- `DocumentoImpreso.jsx` y `documento.css`: la misma tipografía en la vista previa y en el PDF.
- `exportarPdf.js` + `Imprimir.jsx`: Paged.js con CSS `@page` (encabezado, pie y `counter(page)`); la portada usa una página con nombre sin encabezado ni número, y la numeración empieza en 1 después de ella salvo que se elija contarla.
- "Exportar PDF" guarda lo pendiente, abre la vista de impresión en otra pestaña y lanza `window.print()`.

**Interfaz con shadcn/ui**
- Tailwind CSS v4 + shadcn/ui (Button, Card, Badge, Select, Switch, Checkbox, Tabs, Sheet, AlertDialog, Avatar…) e íconos de lucide; se eliminó `estilos.css`.
- Eliminar un documento pide confirmación con un diálogo; en celular las opciones del editor se abren en una hoja lateral.
- Modo oscuro según el sistema.

**Backend**
- Fastify ahora responde 400 a campos desconocidos (`removeAdditional: false`) en lugar de descartarlos en silencio.

**Pruebas**
- PDFs reales generados en Chrome: portada sin encabezado ni número, numeración desde 1, variantes A4/Arial/romanos, logo incluido.
- Prueba automatizada de la interfaz nueva: autoguardado, opciones, exportar, vincular, eliminar, modo oscuro y celular sin desbordamiento.

**Resultado:** exportas un PDF con portada, encabezados y páginas numeradas, igual a la vista previa. ✅
