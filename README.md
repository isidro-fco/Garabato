# Garabato

Garabato es una aplicación web de edición de texto basada en Markdown, diseñada específicamente para estudiantes. Su propósito central es centralizar y optimizar el flujo de trabajo académico, unificando en una sola plataforma la creación de documentos, la gestión de tareas y el calendario de Google Classroom.

A diferencia de otros editores de texto, Garabato se distingue por su enfoque en la personalización de documentos (portadas, encabezados, pies de página) para lograr una presentación profesional, y por su capacidad de exportación a PDF respetando todos los ajustes realizados.
## Correr localmente

Requisitos: Node.js 20+.

```bash
# Backend (http://localhost:3000)
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend (http://localhost:5173), en otra terminal
cd frontend
npm install
npm run dev
```

El frontend redirige `/api` y `/auth` al backend con el proxy de Vite.
