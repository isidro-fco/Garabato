# Garabato

Garabato es una aplicación web de edición de texto basada en Markdown, diseñada específicamente para estudiantes. Su propósito central es centralizar y optimizar el flujo de trabajo académico, unificando en una sola plataforma la creación de documentos, la gestión de tareas y el calendario de Google Classroom.

A diferencia de otros editores de texto, Garabato se distingue por su enfoque en la personalización de documentos (portadas, encabezados, pies de página) para lograr una presentación profesional, y por su capacidad de exportación a PDF respetando todos los ajustes realizados.
## Correr localmente

Requisitos: Node.js 24 y pnpm (`corepack enable` o `npm install -g pnpm`).

```bash
# Backend (http://localhost:3000)
cd backend
cp .env.example .env   # y llena los valores
pnpm install
pnpm dev

# Frontend (http://localhost:5173), en otra terminal
cd frontend
pnpm install
pnpm dev
```

El frontend redirige `/api` y `/auth` al backend con el proxy de Vite.

## Despliegue

```
Navegador ──► Vercel (frontend) ──/api, /auth──► Render (backend) ──► Neon (prod)
```

Vercel sirve la app y reenvía `/api` y `/auth` a Render (`frontend/vercel.json`). Para el navegador todo está en el mismo dominio, así que la cookie de sesión funciona sin CORS.

### 1. Neon

En el proyecto de Neon, abre la base `prod` → **Connect** y copia la cadena de conexión. Cambia el final a `?sslmode=verify-full&channel_binding=require`. Las tablas se crean solas la primera vez que arranca el backend.

### 2. Render (backend)

1. **New → Blueprint** y elige este repositorio. Render lee `render.yaml` y crea el servicio `garabato-api` (Node 24, región Ohio, carpeta `backend`, health check en `/api/health`). `SESSION_SECRET` se genera solo.
2. Captura las variables que pide:
   - `DATABASE_URL`: la de `prod` del paso 1.
   - `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`: las mismas de desarrollo.
   - `GOOGLE_REDIRECT_URI`: `https://<tu-proyecto>.vercel.app/auth/callback`. Si todavía no sabes el dominio de Vercel, pon el que esperas y corrígelo después del paso 3.
3. Cuando termine, abre `https://garabato-api-brzf.onrender.com/api/health`: debe responder `{"ok":true}`. Si Render le dio otra URL al servicio, cámbiala en los dos `destination` de `frontend/vercel.json`.

### 3. Vercel (frontend)

**Add New → Project**, importa el repositorio y en **Root Directory** elige `frontend`. Lo demás ya está en `vercel.json` (pnpm, build y rewrites). Al terminar, anota el dominio (`https://<tu-proyecto>.vercel.app`).

### 4. Google Cloud

- **APIs y servicios → Credenciales →** tu ID de cliente OAuth **→ URI de redireccionamiento autorizados**: agrega `https://<tu-proyecto>.vercel.app/auth/callback` (deja también la de `localhost`).
- **Pantalla de consentimiento → Usuarios de prueba**: agrega los correos que van a usar la app.
- Revisa que `GOOGLE_REDIRECT_URI` en Render sea exactamente la misma URI.

### Notas

- El plan gratis de Render se duerme tras 15 minutos sin uso: la primera petición puede tardar cerca de un minuto.
- Mientras la app esté en modo de prueba en Google, la sesión con Google vence cada 7 días y hay que volver a iniciar sesión.
- El inicio de sesión solo funciona en el dominio de producción de Vercel, no en los deploys de vista previa (su URI no está registrada en Google).
