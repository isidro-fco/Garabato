import { Link, useOutletContext } from 'react-router-dom'

// Por ahora solo da la bienvenida; el calendario llega en la fase 6.
export default function Inicio() {
  const { usuario } = useOutletContext()
  const nombre = usuario.nombre.split(' ')[0]

  return (
    <>
      <header className="encabezado">
        <h1>Hola, {nombre}</h1>
        <p className="suave" style={{ margin: 0 }}>Aquí verás tu calendario de entregas y tu horario.</p>
      </header>
      <div className="acciones">
        <Link className="boton boton-primario" to="/clases">Ver mis clases</Link>
      </div>
    </>
  )
}
