import { useSearchParams } from 'react-router-dom'
import { URL_LOGIN } from '../api.js'

const ERRORES = {
  sesion: 'Tu sesión terminó. Vuelve a iniciar sesión.',
  reconectar: 'Tu conexión con Google venció. Vuelve a iniciar sesión.',
}

export default function Login() {
  const [params] = useSearchParams()
  const error = params.get('error')

  return (
    <main style={{ padding: '5rem 1rem', maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem' }}>Garabato</h1>
      <p className="suave">Tus documentos y tareas de Classroom en un solo lugar.</p>

      {error && (
        <p className="mensaje mensaje-error" role="alert" style={{ marginTop: '1.5rem' }}>
          {ERRORES[error] ?? 'No se pudo iniciar sesión. Inténtalo de nuevo.'}
        </p>
      )}

      <a href={URL_LOGIN} className="boton boton-primario" style={{ marginTop: '1.5rem' }}>
        Iniciar sesión con Google
      </a>
    </main>
  )
}
