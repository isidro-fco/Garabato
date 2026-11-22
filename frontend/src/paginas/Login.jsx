import { useSearchParams } from 'react-router-dom'
import { URL_LOGIN } from '../api.js'
import { MensajeError } from '../componentes/Estado.jsx'
import { Button } from '@/componentes/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/componentes/ui/card'

const ERRORES = {
  sesion: 'Tu sesión terminó. Vuelve a iniciar sesión.',
  reconectar: 'Tu conexión con Google venció. Vuelve a iniciar sesión.',
}

function LogoGoogle() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  )
}

export default function Login() {
  const [params] = useSearchParams()
  const error = params.get('error')

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">Garabato</CardTitle>
          <CardDescription>Tus documentos y tareas de Classroom en un solo lugar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <MensajeError error={{ message: ERRORES[error] ?? 'No se pudo iniciar sesión. Inténtalo de nuevo.' }} />}
          <Button asChild size="lg" variant="outline" className="w-full">
            <a href={URL_LOGIN}>
              <LogoGoogle />
              Iniciar sesión con Google
            </a>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
