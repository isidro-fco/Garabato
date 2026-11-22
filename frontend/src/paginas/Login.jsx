import { useSearchParams } from 'react-router-dom'
import { URL_LOGIN } from '../api.js'

export default function Login() {
  const [params] = useSearchParams()
  const huboError = params.has('error')

  return (
    <main style={{ fontFamily: 'system-ui', padding: '4rem 1rem', maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
      <h1>Garabato</h1>
      <p>Tus documentos y tareas de Classroom en un solo lugar.</p>

      {huboError && (
        <p role="alert" style={{ color: '#b3261e' }}>
          No se pudo iniciar sesión. Inténtalo de nuevo.
        </p>
      )}

      <a
        href={URL_LOGIN}
        style={{
          display: 'inline-block',
          marginTop: '1rem',
          padding: '0.75rem 1.25rem',
          border: '1px solid #ccc',
          borderRadius: 8,
          color: 'inherit',
          textDecoration: 'none',
        }}
      >
        Iniciar sesión con Google
      </a>
    </main>
  )
}
