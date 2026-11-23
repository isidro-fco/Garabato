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

---

## Iteración 7 — Fase 6: Pantalla de inicio y horario (22 nov 2026)

**Backend**
- Módulo `horarios/`: `GET`, `POST`, `PATCH` y `DELETE /api/horarios`. Horas en formato `HH:MM`, día de 0 (domingo) a 6; si la hora de fin no es posterior a la de inicio responde 400. Cada usuario solo ve y modifica sus horarios.

**Frontend**
- `Configuracion.jsx`: tarjeta por materia con su color; se agregan bloques eligiendo uno o varios días con hora de inicio y fin, y avisa si se cruzan con otra clase.
- `Inicio.jsx` con FullCalendar 6.1:
  - Pestaña "Entregas": mes con las tareas pendientes, un color por materia y las atrasadas marcadas; clic → la tarea. En celular se ve como lista.
  - Pestaña "Horario": semana con `timegrid` (lunes a viernes, o con fin de semana si hay clases), solo el rango de horas usado; clic → la materia. En celular, un día a la vez.
- Inicio y el editor se cargan bajo demanda: el paquete principal bajó de 456 a 375 kB.
- En celular, la barra superior muestra solo íconos y el nombre de la sección actual.
- Se quitó `package-lock.json`; el frontend usa solo pnpm.

**Corrección**
- Las entregas de la noche (por ejemplo 23:59) se estiraban al día siguiente porque FullCalendar les asignaba 1 h de duración; ahora duran un instante.

**Pruebas**
- CRUD de horarios contra la base `dev` con usuarios temporales (15/15).
- Prueba en Chrome: calendario, colores, atrasadas, clics, captura de horario, choques, modo oscuro y celular.

**Resultado:** la pantalla de inicio muestra tus entregas y tu horario semanal. ✅

---

## Iteración 8 — Fase 7: Formateador APA (22 nov 2026)

**Frontend**
- `utils/apa.js`: referencias y citas en APA 7 (adaptación al español) para libro, artículo de revista y página web:
  - Autores: iniciales, "y" entre los dos últimos, "et al." en citas de tres o más, regla de 21 o más autores, organizaciones como autor.
  - Fechas: "s.f." sin fecha, día y mes en páginas web, letras para el mismo autor y año (1975a, 1975b).
  - Edición ("2.ª ed."), volumen en cursivas con el número entre paréntesis, rangos de páginas con guion largo, DOI como `https://doi.org/…`.
  - Orden alfabético por autor (Á junto con A), sin fecha primero.
- `FuentesApa.jsx`: panel para agregar, editar y borrar fuentes con vista previa de la referencia; botones para insertar la cita parentética o narrativa (con página opcional) donde está el cursor.
- `DocumentoImpreso.jsx`: sección "Referencias" generada al final, en página nueva (opcional), título centrado y sangría francesa de 1.27 cm. Las fuentes se guardan en `opciones.referencias`.

**Pruebas**
- 23 casos del formateador con ejemplos de APA 7.
- Prueba en Chrome: agregar tres fuentes, citar en el cursor, editar, borrar, celular y PDF con la sección de referencias.

**Resultado:** agregas tres fuentes y el PDF sale con su sección de referencias bien formateada. ✅

---

## Iteración 9 — Fase 8: Despliegue (22 nov 2026)

**Arquitectura**
- Frontend en Vercel (`https://garabato-olive.vercel.app`) y API en Render (`https://garabato-api-brzf.onrender.com`), con la base `prod` de Neon.
- Vercel reenvía `/api` y `/auth` a Render (`frontend/vercel.json`), así que para el navegador todo es el mismo dominio: la cookie de sesión funciona sin CORS.

**Configuración**
- `render.yaml` (Blueprint): servicio en Ohio, cerca de Neon (us-east-2), health check en `/api/health`, `SESSION_SECRET` generado por Render y el resto de variables capturadas a mano.
- Ambos proyectos fijan pnpm 12.4.1 (`packageManager`) y Node 24; se quitaron los `package-lock.json`.
- `config.js` valida que `SESSION_SECRET` sea una llave de 32 bytes.
- Google Cloud: URI de redirección de producción `https://garabato-olive.vercel.app/auth/callback`.
- README con la guía de despliegue.

**Problemas resueltos**
- El login mandaba a `localhost`: la variable `GOOGLE_REDIRECT_URI` de Render tenía la URL local.
- Los deploys nuevos no quedaban activos: el health check apuntaba a `/api/salud` y la ruta se renombró a `/api/health`.
- `redirect_uri_mismatch` de Google: faltaba registrar la URI de producción en el cliente OAuth.

**Resultado:** la app funciona en producción con el login de Google. ✅

---

## Iteración 10 — Fase 9: Pulido y entrega (22 nov 2026)

**Arranque lento de Render**
- `api.js`: si el servidor está dormido (502/503/504 del proxy o sin conexión), las consultas GET se reintentan solas durante unos 75 s. Las acciones (POST, PATCH, DELETE) no se reintentan, para no duplicar documentos.
- `Cargando`: si tarda más de 5 s, avisa que el servidor puede tardar hasta un minuto en despertar.
- Login: al abrir la página despierta al servidor con `/api/health`, y el botón muestra "Conectando con Google…".

**Mensajes de error**
- Mensajes claros para sin conexión, servidor dormido y fallo de Classroom.
- Botón "Reintentar" cuando una página no pudo cargar; en los errores de una acción solo sale el mensaje.

**Diseño**
- Revisión de las 9 páginas en escritorio y celular, en modo claro y oscuro: sin desbordes ni errores en consola.
- En celular, el horario abre en el siguiente día con clases si hoy no hay.

**README**
- Enlace a la app, lista de funciones, capturas (`docs/capturas/`), stack, estructura de carpetas y guía para la demo.

**Pruebas**
- Backend falso que simula a Render dormido: carga sola al despertar, aviso de espera, error claro con Reintentar y POST sin reintentos (9/9).

**Pendiente:** preparar la demo el día de la presentación (pasos en el README).

**Resultado:** la app aguanta el arranque lento de Render y el README la presenta con capturas. ✅

---

## Iteración 11 — Selección de materias activas (22 nov 2026)

**Frontend**
- `Bienvenida.jsx`: en el primer acceso, antes de entrar a la app, el usuario escoge qué materias de Classroom está cursando (todas marcadas de inicio, "Todas" / "Ninguna", al menos una).
- `SelectorMaterias.jsx`: el mismo selector se usa en la bienvenida y en una nueva sección "Materias" de Configuración.
- Solo las materias elegidas aparecen en Clases (con aviso de cuántas están ocultas), en las entregas y el horario del inicio, en el editor de horario y al vincular un documento a una tarea. Los documentos se siguen mostrando todos.
- `RutaPrivada` comparte `materias` y `cambiarMaterias` con todas las páginas.

**Backend**
- Columna `usuarios.materias` (`TEXT[]`, `NULL` = todavía no elige), devuelta en `/api/yo`.
- `PUT /api/yo/materias` para guardar la selección (sin repetidos, máximo 200).

**Pruebas**
- Backend contra la base `dev` con usuarios temporales.
- Prueba en Chrome (20/20): bienvenida, filtro en cada página, guardar desde Configuración, persistencia, celular y modo oscuro.

**Resultado:** cada usuario ve solo las materias que cursa, en el celular y en la computadora. ✅

---

## Iteración 12 — Horario pintable (22 nov 2026)

**Frontend**
- `HorarioPintable.jsx` reemplaza el formulario de bloques en Configuración: una tabla semanal (lunes a sábado, domingo opcional, de 7:00 a 22:00) dividida en horas.
- Abajo, fijo mientras se recorre la tabla, un selector con las materias activas (color y horas pintadas) y un borrador. Se elige una materia y se arrastra sobre la tabla para pintar; repasar la misma materia la borra y pintar encima de otra la reemplaza. En celular se toca cada hora; también funciona con teclado.
- Cada trazo se guarda solo ("Guardando…" / "Guardado"); las horas seguidas de una materia se unen en un bloque.
- `utils/horario.js`: conversión entre bloques guardados y celdas de una hora (una hora se pinta si la clase ocupa al menos la mitad).

**Backend**
- `PUT /api/horarios`: reemplaza en una transacción los bloques de las materias indicadas; los de materias ocultas no se tocan.

**Pruebas**
- Backend contra la base `dev` con usuarios temporales (8/8).
- Conversión bloques ↔ celdas (11/11).
- Prueba en Chrome (23/23): pintar arrastrando, borrar, reemplazar, teclado, persistencia, domingo, inicio, celular con toque y modo oscuro.

**Resultado:** el horario se captura pintando la tabla en lugar de llenar un formulario por bloque. ✅

---

## Iteración 13 — Editor en hojas tamaño carta y portada universitaria (22 nov 2026)

**Editor**
- `EditorMarkdown.jsx` (CodeMirror 6) reemplaza el textarea y la vista previa aparte: el Markdown se ve ya formateado (títulos, negritas, listas, casillas, citas, tablas, imágenes) y solo la línea donde está el cursor muestra sus marcas (`utils/vistaEnVivo.js`). Ctrl+B / Ctrl+I, Enter continúa listas, deshacer y rehacer.
- `Escritorio.jsx`: el documento siempre se ve como hojas del tamaño real (carta o A4) sobre un fondo gris: portada, texto y referencias, con los márgenes, letra e interlineado del PDF. Se reduce si no cabe; en celular la letra no baja de 15 px.
- La hoja del texto crece por páginas, con los cortes marcados y el número de cada página según las opciones (aproximado al PDF).
- Se quitó el botón "Vista de impresión" (`VistaPrevia.jsx`). Casillas "Ocultar portada" y "Ocultar números de página" (solo cambian la vista; se recuerdan en el navegador).

**Portada**
- Distribución de portada universitaria: logos en las esquinas, institución y facultad, carrera, cada dato con su etiqueta arriba (materia, tema, profesor/a, alumno, matrícula, grupo) y al final lugar y fecha. Campos nuevos: facultad, carrera, grupo, lugar y cómo se muestra el maestro.
- Segundo logo: con dos, cada uno en una esquina superior a la misma altura.
- `utils/imagenes.js`: los logos conservan la transparencia (PNG/WebP sin fondo) y el botón "Quitar fondo" vuelve transparente un fondo de un solo color sin borrar el interior del logo.
- "Agregar estudiante" para trabajos en equipo: con varios, la portada muestra "Alumnos:" con un renglón "Nombre (matrícula)" por estudiante.

**Pruebas**
- Prueba en Chrome del editor en vivo y las hojas (30/30 y 20/20), logos (19/19 y 4/4), portada (4/4) y equipo (7/7), en escritorio, celular y modo oscuro, revisando también el PDF.

**Resultado:** se escribe directamente sobre hojas que se ven como el documento final, con una portada como la que pide la universidad. ✅

---

## Iteración 14 — Configuración en menú, colores del editor y tema (22 nov 2026)

**Documentación**
- La bitácora se movió a `docs/BITACORA.md` y desde ahora lleva un resumen por commit.
- `docs/bitacora IA Claude.md`: todas las conversaciones con Claude, regeneradas al terminar cada respuesta (hook local de Claude Code), con datos personales y secretos ocultos.

**Frontend**
- Configuración es un menú de tarjetas (Materias, Horario, Colores del editor y Tema) con un resumen de cada una; cada opción se abre en una ventana flotante (`ui/dialog.jsx`), con su estado en la URL (`?abrir=…`) para que "atrás" la cierre. En celular ocupa toda la pantalla.
- Colores del editor (`ColoresMarkdown.jsx`): un color por elemento de Markdown (títulos H1–H6, negrita, cursiva, tachado, enlaces, código, citas, listas y símbolos) con vista previa en vivo sobre texto lorem y opción para ver los símbolos.
- Paleta predeterminada estilo Tokyo Night en `paleta-markdown.json`, con versión para tema oscuro y para tema claro / PDF.
- El PDF usa los mismos colores (siempre los del tema claro); la casilla "Colores en el PDF" de cada documento permite imprimir todo en negro. Portada y referencias quedan en negro.
- Tema de la app: Sistema, Claro u Oscuro (`utils/tema.js`, `SelectorTema.jsx`), guardado en el dispositivo.
- Corregido: una regla de color por línea impedía ver las citas en gris y cambiar el color de los títulos.

**Backend**
- Columna `usuarios.colores` (`JSONB`) con solo los colores elegidos; `PUT /api/yo/colores` valida claves y colores `#rrggbb`. `/api/yo` los devuelve. Los colores que estaban solo en el navegador se suben a la cuenta la primera vez.

**Pruebas**
- Backend contra la base `dev` con usuarios temporales (18/18).
- Prueba en Chrome: colores (20/20), colores en la cuenta (12/12), PDF con colores (9/9), menú de Configuración (17/17), tema (14/14), y de nuevo materias, horario y editor; en escritorio, celular y modo oscuro.

**Resultado:** Configuración muestra solo lo necesario y cada opción se abre aparte; el editor y el PDF tienen colores personalizables guardados en la cuenta. ✅

## Iteración 15 — Materias sin Classroom en el horario (22 nov 2026)

**Frontend**
- En Configuración → Horario, el botón "Otra materia (sin Classroom)" agrega materias que no tienen clase en Classroom; quedan como pincel y se pintan igual que las demás. Cada una se puede quitar (con confirmación si ya tiene horas).
- Validación al escribir: no se puede repetir el nombre de una clase de Classroom ni de otra materia propia (sin importar mayúsculas, acentos ni espacios).
- Inicio → Horario muestra también las materias propias (sin enlace a página de clase).

**Backend**
- Tabla `materias_propias` (índice único por usuario y nombre); en `horarios` se identifican como `propia-<id>`.
- `GET/POST/DELETE /api/materias-propias`. Al crear, se revisa contra las clases de Classroom y las propias (409 `materia_repetida`); al borrar, también se borran sus horas.

**Pruebas**
- Validación de nombres repetidos (Classroom, propias, acentos y espacios) y build del frontend. Falta probarla en la app.

**Resultado:** el horario puede incluir clases que no tienen apartado en Classroom, sin duplicar materias. ✅

## Iteración 16 — Pruebas de casos límite (22 nov 2026)

**Backend**
- `src/app.js` arma la app (la usan `server.js` y las pruebas).
- Guardar el horario dos veces a la vez ya no duplica bloques (un guardado a la vez por usuario, `FOR UPDATE`).
- Se quita el carácter nulo (`\u0000`, p. ej. al pegar de un PDF), que causaba error 500.
- Sin conversión de tipos: un número donde va texto (o al revés) responde 400.
- Errores en español y sin detalles internos: datos inválidos → 400 `datos_invalidos`; id con formato inválido en la URL → 404; error 500 genérico.

**Frontend**
- `LimiteErrores.jsx`: si una página falla al mostrarse, aparece un aviso con "Recargar" e "Ir al inicio" en lugar de la pantalla en blanco; la barra lateral sigue visible.
- "Agregar materia" envía una sola vez aunque se pulse varias veces seguidas.
- Al cerrar o recargar mientras se guarda el horario, el navegador pide confirmar.
- "No encontrado" muestra el mensaje del servidor (documento, clase o tarea).

**Pruebas**
- `backend/test/casos-limite.test.js` (`npm test`): 38/38 contra la base `dev` con usuarios temporales y Classroom simulado. Cubre sesión, campos vacíos, tipos equivocados, textos al límite, ids inválidos, JSON mal formado, documentos de más de 4 MB, doble clic, datos de otro usuario y listas vacías.
- Prueba en Chrome: nombres vacíos, repetidos y largos; triple clic en Agregar; doble clic en "Nuevo documento"; título de 250 letras; recargar a medio escribir y a medio pintar; quitar una materia con horas; enlaces inexistentes; servidor sin respuesta y recuperación; página que falla.

**Resultado:** la app avisa con mensajes claros o impide la acción en los casos límite, sin pantallas en blanco, errores 500 ni datos duplicados. ✅
