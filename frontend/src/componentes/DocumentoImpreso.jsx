import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { variablesDocumento } from '../utils/opcionesDocumento.js'

// remark-gfm agrega tablas, listas de tareas, tachado y enlaces automáticos.
const PLUGINS = [remarkGfm]

const COMPONENTES = {
  a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
}

// El documento tal como se imprime: portada (si está activa) y el contenido.
// Lo usan la vista previa del editor y el PDF.
export default function DocumentoImpreso({ titulo, contenido, opciones, separadorPortada = null }) {
  const { portada } = opciones

  return (
    <div className="documento" style={variablesDocumento(opciones)}>
      {portada.activa && (
        <>
          <Portada portada={portada} tituloDocumento={titulo} />
          {separadorPortada}
        </>
      )}
      <div className="doc-cuerpo">
        <Markdown remarkPlugins={PLUGINS} components={COMPONENTES}>{contenido}</Markdown>
      </div>
    </div>
  )
}

function Portada({ portada, tituloDocumento }) {
  const datos = [
    ['Alumno', portada.alumno],
    ['Matrícula', portada.matricula],
    ['Maestro', portada.maestro],
  ].filter(([, valor]) => valor)

  return (
    <section className="portada">
      {portada.logo && <img className="portada-logo" src={portada.logo} alt="" />}
      {portada.institucion && <p className="portada-institucion">{portada.institucion}</p>}
      <div className="portada-centro">
        <h1 className="portada-titulo">{portada.titulo || tituloDocumento}</h1>
        {portada.materia && <p className="portada-materia">{portada.materia}</p>}
      </div>
      {datos.length > 0 && (
        <div className="portada-datos">
          {datos.map(([etiqueta, valor]) => <p key={etiqueta}>{etiqueta}: {valor}</p>)}
        </div>
      )}
      {portada.fecha && <p className="portada-fecha">{portada.fecha}</p>}
    </section>
  )
}
