import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { listaReferencias } from '../utils/apa.js'
import { variablesDocumento } from '../utils/opcionesDocumento.js'

// remark-gfm agrega tablas, listas de tareas, tachado y enlaces automáticos.
const PLUGINS = [remarkGfm]

const COMPONENTES = {
  a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
}

// En una referencia solo se permiten cursivas y enlaces (los genera apa.js).
const ELEMENTOS_REFERENCIA = ['p', 'em', 'a']

// El documento tal como se imprime: portada (si está activa), el contenido y
// las referencias. Lo usan la vista previa del editor y el PDF.
// separador: lo que marca un salto de página en la vista previa.
export default function DocumentoImpreso({ titulo, contenido, opciones, separador = null }) {
  const { portada, referencias } = opciones
  const fuentes = listaReferencias(referencias.fuentes)

  return (
    <div className="documento" style={variablesDocumento(opciones)}>
      {portada.activa && (
        <>
          <Portada portada={portada} tituloDocumento={titulo} />
          {separador}
        </>
      )}
      <div className="doc-cuerpo">
        <Markdown remarkPlugins={PLUGINS} components={COMPONENTES}>{contenido}</Markdown>
      </div>
      {fuentes.length > 0 && (
        <>
          {referencias.nuevaPagina && separador}
          <section className={referencias.nuevaPagina ? 'referencias nueva-pagina' : 'referencias'}>
            <h1>Referencias</h1>
            {fuentes.map(({ id, markdown }) => (
              <Markdown key={id} allowedElements={ELEMENTOS_REFERENCIA} unwrapDisallowed components={COMPONENTES}>{markdown}</Markdown>
            ))}
          </section>
        </>
      )}
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
