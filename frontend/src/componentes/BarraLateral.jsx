import { Link, NavLink, useNavigate } from 'react-router-dom'
import { cerrarSesion } from '../api.js'

export default function BarraLateral({ usuario }) {
  const navigate = useNavigate()

  async function salir() {
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="barra">
      <Link to="/" className="barra-logo">Garabato</Link>

      <nav className="barra-nav" aria-label="Principal">
        <NavLink to="/" end>Inicio</NavLink>
        <NavLink to="/clases">Clases</NavLink>
        <NavLink to="/documentos">Documentos</NavLink>
        <NavLink to="/configuracion">Configuración</NavLink>
      </nav>

      <div className="barra-usuario">
        <div className="barra-usuario-datos" title={usuario.correo}>
          {usuario.foto && (
            <img className="avatar" src={usuario.foto} alt="" referrerPolicy="no-referrer" />
          )}
          <span>{usuario.nombre}</span>
        </div>
        <button className="boton" onClick={salir}>Cerrar sesión</button>
      </div>
    </aside>
  )
}
