import { useNavigate, useOutletContext } from 'react-router-dom'
import { cerrarSesion } from '../api.js'

// Por ahora solo muestra al usuario; el calendario llega en la fase 6.
export default function Inicio() {
  const { usuario } = useOutletContext()
  const navigate = useNavigate()

  async function salir() {
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {usuario.foto && (
          <img
            src={usuario.foto}
            alt=""
            width={48}
            height={48}
            referrerPolicy="no-referrer"
            style={{ borderRadius: '50%' }}
          />
        )}
        <div>
          <h1 style={{ margin: 0 }}>Hola, {usuario.nombre}</h1>
          <p style={{ margin: 0, color: '#666' }}>{usuario.correo}</p>
        </div>
      </div>

      <button onClick={salir} style={{ marginTop: '2rem' }}>
        Cerrar sesión
      </button>
    </main>
  )
}
