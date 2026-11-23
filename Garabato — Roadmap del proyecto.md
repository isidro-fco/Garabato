# Garabato — Roadmap del proyecto

Nov 21, 2026 · @Isidro

Roadmap del proyecto final de Aplicaciones Web. Cada fase termina con algo que se puede probar, así siempre hay una versión que funciona.

**Stack:** Vite + React + JS (frontend) · Fastify (backend) · PostgreSQL en Neon (base de datos) · Hosting: Vercel (frontend), Render (backend), Neon (DB).

## Estructura del proyecto

Un repositorio con dos carpetas: `backend/` (Fastify) y `frontend/` (Vite + React). En el backend hay una carpeta por funcionalidad, y cada una tiene un archivo `routes` que solo recibe la petición y responde, y un archivo `service` que hace el trabajo.

```
garabato/
├── backend/
│   ├── src/
│   │   ├── server.js             # crea Fastify, registra plugins y módulos
│   │   ├── config.js             # lee el .env
│   │   ├── db.js                 # conexión a PostgreSQL (Neon) con pg y creación de tablas
│   │   ├── plugins/
│   │   │   ├── auth.js           # decorador requireAuth (preHandler)
│   │   │   └── cors.js
│   │   └── modulos/
│   │       ├── auth/
│   │       │   ├── auth.routes.js      # /auth/google, /auth/callback, /auth/logout
│   │       │   └── auth.service.js
│   │       ├── classroom/
│   │       │   ├── classroom.routes.js # /api/clases, /api/clases/:id/tareas
│   │       │   └── classroom.service.js
│   │       ├── documentos/
│   │       │   ├── documentos.routes.js
│   │       │   └── documentos.service.js
│   │       └── horarios/
│   │           ├── horarios.routes.js
│   │           └── horarios.service.js
│   ├── .env.example
│   └── package.json              # "type": "module"
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx               # rutas (react-router-dom)
│   │   ├── api.js                # fetch al backend con credentials: "include"
│   │   ├── paginas/
│   │   │   ├── Login.jsx
│   │   │   ├── Inicio.jsx        # calendario de tareas / horario
│   │   │   ├── Clases.jsx
│   │   │   ├── Materia.jsx       # info, mosaicos de tareas, instrucciones
│   │   │   ├── Editor.jsx
│   │   │   └── Configuracion.jsx
│   │   ├── componentes/
│   │   │   ├── BarraLateral.jsx
│   │   │   ├── MosaicoTarea.jsx
│   │   │   ├── VistaPrevia.jsx
│   │   │   └── OpcionesDocumento.jsx  # portada, encabezado, pie, numeración
│   │   └── utils/
│   │       ├── apa.js            # formateador de citas APA
│   │       └── exportarPdf.js    # Paged.js + window.print()
│   ├── vercel.json               # rewrites de /api y /auth hacia Render
│   ├── vite.config.js            # proxy /api y /auth → localhost:3000
│   └── package.json
│
└── README.md
```

**Base de datos (3 tablas):** `usuarios` (id de Google, nombre, correo, foto, refresh token), `documentos` (título, contenido Markdown, `opciones` en JSONB, curso y tarea de Classroom opcionales) y `horarios` (curso, día, hora de inicio y de fin). Las clases y tareas no se guardan: se piden directo a Classroom.

## Fase 0: Preparación

- [x] Crear el repositorio `garabato/` en GitHub con las carpetas `backend/` y `frontend/`, un `.gitignore` y un `README.md`.
- [x] Backend: `npm init`, `"type": "module"`, instalar `fastify` y `dotenv`, y crear la ruta `GET /api/salud` que responda `{ ok: true }`.
- [x] Frontend: `npm create vite@latest frontend -- --template react`, instalar `react-router-dom` y configurar el proxy en `vite.config.js`.
- [x] Crear el proyecto en Neon con dos bases de datos: `dev` y `prod`.
- [x] En Google Cloud (proyecto Garabato): activar la Classroom API, configurar la pantalla de consentimiento en modo Testing y agregar los correos de prueba.
- [x] Crear las credenciales OAuth con la redirección `http://localhost:5173/auth/callback`.

**Listo cuando:** el frontend muestra el `{ ok: true }` que responde el backend.

## Fase 1: Base de datos y autenticación

- [x] Hacer `db.js` con `pg` y `crearTablas()`.
- [x] Hacer `config.js` y `.env.example`.
- [x] Configurar `@fastify/secure-session` y `@fastify/oauth2` con Google.
- [x] Crear `/auth/google`, `/auth/callback` (guarda o actualiza el usuario y su refresh token), `/auth/logout` y `/api/yo`.
- [x] Crear el decorador `requireAuth`.
- [x] Frontend: página `Login.jsx` con el botón "Iniciar sesión con Google" y un componente que proteja las rutas privadas.

**Listo cuando:** inicias sesión con Google, aparece tu nombre y foto, y al recargar la página sigues con la sesión iniciada.

## Fase 2: Integración con Classroom (backend)

- [x] En `classroom.service.js`, crear el cliente de `googleapis` con el refresh token del usuario.
- [x] `GET /api/clases`: lista de cursos.
- [x] `GET /api/clases/:id`: información del curso y los maestros (`courses.teachers.list`).
- [x] `GET /api/clases/:id/tareas`: tareas con fecha de entrega e instrucciones.
- [x] `GET /api/tareas/pendientes`: tareas de todas las clases, para el calendario.
- [x] Manejar los errores de token vencido o permiso denegado.

**Listo cuando:** probando con Thunder Client o Postman ves tus clases y tareas reales. Aquí también es cuando debes probar con la cuenta de UABC.

## Fase 3: Navegación y vistas de clases (frontend)

- [x] Layout con `BarraLateral.jsx` (Inicio, Clases, Configuración y Cerrar sesión).
- [x] `api.js` con todas las llamadas al backend.
- [x] `Clases.jsx`: lista de materias.
- [x] `Materia.jsx`: información general y mosaicos de tareas (`MosaicoTarea.jsx`).
- [x] Vista de instrucciones de la tarea, con un botón "Crear documento para esta tarea".

**Listo cuando:** puedes navegar Clases → Materia → Tarea con tus datos reales.

## Fase 4: Editor Markdown (el núcleo)

- [x] Backend: CRUD `/api/documentos` (listar, obtener, crear, actualizar y eliminar).
- [x] `Editor.jsx`: un `textarea` a la izquierda y `VistaPrevia.jsx` con `react-markdown` a la derecha.
- [x] Autoguardado con debounce: guardar después de 1–2 segundos sin escribir.
- [x] Lista de "Mis documentos" y la opción de vincular un documento a una tarea.

**Listo cuando:** escribes, cierras la pestaña, vuelves y el documento sigue ahí.

## Fase 5: Personalización y exportación a PDF

- [x] `OpcionesDocumento.jsx`: formulario de portada (título, materia, maestro, alumno, matrícula, fecha y logo), encabezado, pie de página y numeración (posición y estilo). Todo se guarda en `opciones`.
- [x] Rellenar la portada automáticamente con los datos de la clase y del usuario.
- [x] `exportarPdf.js`: Paged.js con CSS `@page` para márgenes, encabezados, pies y `counter(page)`, y después `window.print()`.
- [x] Hacer que la portada no lleve encabezado ni número de página.

**Listo cuando:** exportas un PDF con portada, encabezados y páginas numeradas, igual a la vista previa.

## Fase 6: Pantalla de inicio y horario

- [x] Backend: CRUD `/api/horarios`.
- [x] `Configuracion.jsx`: capturar el horario de cada materia (días y horas).
- [x] `Inicio.jsx`: FullCalendar con las tareas pendientes en vista de mes.
- [x] Botón para cambiar a la vista "Horario", que muestra la semana con `timegrid`.
- [x] Hacer que al dar clic en una tarea del calendario te lleve a su materia o tarea.

**Listo cuando:** la pantalla de inicio muestra tus entregas y tu horario semanal.

## Fase 7: Formateador APA

- [x] `utils/apa.js`: formulario por tipo de fuente (libro, artículo y página web) que genera la referencia en formato APA 7.
- [x] Botón en el editor que inserta la cita en el texto y la referencia en una sección "Referencias".
- [x] Ordenar las referencias alfabéticamente y aplicar sangría francesa en el PDF.

**Listo cuando:** agregas tres fuentes y el PDF sale con su sección de referencias bien formateada.

## Fase 8: Despliegue

- [x] Neon: usar la base de datos `prod` y copiar su `DATABASE_URL`.
- [x] Render: crear un Web Service con raíz en `backend/`, pnpm como build (Blueprint en `render.yaml`), `node src/server.js` como comando de inicio, y cargar las variables de entorno.
- [x] Vercel: crear el proyecto con raíz en `frontend/` y el `vercel.json` con los rewrites.
- [x] Google Cloud: agregar la URI de redirección de producción (`https://…vercel.app/auth/callback`).
- [x] Probar todo el flujo en producción: login, clases, documento, PDF y calendario.

**Listo cuando:** alguien de la lista de usuarios de prueba puede usar la app desde su celular.

## Fase 9: Pulido y entrega

- [x] Estados de carga (sobre todo por el arranque lento de Render) y mensajes de error claros.
- [x] Diseño responsivo básico y un estilo consistente con la estética minimalista del plan.
- [x] README con capturas, el stack y los pasos para correrlo localmente.
- [ ] Preparar la demo: abrir la app unos minutos antes y tener un documento de ejemplo listo.

## Fuera de alcance por ahora

- Integración con Blackboard (fase 2 del plan original).
- El registro con correo y contraseña. El login con Google ya crea al usuario en su primer acceso, así que ese funciona como el registro.

## Si falta tiempo

Las fases 0 a 5 y la 8 son el mínimo que demuestra la idea: login, Classroom, editor y PDF desplegados. Si se junta el tiempo, simplificar la fase 6 dejando solo el calendario de tareas sin el horario, y dejar la fase 7 (APA) para el final.
