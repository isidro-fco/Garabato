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

// El documento tal como se imprime (PDF): portada (si está activa), el contenido
// y las referencias. El editor usa Portada y Referencias en sus propias hojas.
export default function DocumentoImpreso({ titulo, contenido, opciones }) {
  const { portada, referencias } = opciones
  const fuentes = listaReferencias(referencias.fuentes)

  return (
    <div className="documento" style={variablesDocumento(opciones)}>
      {portada.activa && <Portada portada={portada} tituloDocumento={titulo} />}
      <div className="doc-cuerpo">
        <Markdown remarkPlugins={PLUGINS} components={COMPONENTES}>{contenido}</Markdown>
      </div>
      {fuentes.length > 0 && <Referencias fuentes={fuentes} nuevaPagina={referencias.nuevaPagina} />}
    </div>
  )
}

// fuentes: lista ya formateada (listaReferencias de utils/apa.js).
export function Referencias({ fuentes, nuevaPagina }) {
  return (
    <section className={nuevaPagina ? 'referencias nueva-pagina' : 'referencias'}>
      <h1>Referencias</h1>
      {fuentes.map(({ id, markdown }) => (
        <Markdown key={id} allowedElements={ELEMENTOS_REFERENCIA} unwrapDisallowed components={COMPONENTES}>{markdown}</Markdown>
      ))}
    </section>
  )
}

// Distribución de una portada universitaria: logos en las esquinas; institución,
// facultad y carrera; cada dato con su etiqueta arriba; al final lugar y fecha.
// Todo centrado y repartido en la hoja. Lo vacío no se muestra.
export function Portada({ portada, tituloDocumento }) {
  const logos = [portada.logo, portada.logo2].filter(Boolean)
  // Con varios estudiantes: solo "Alumnos:", un renglón por cada uno con su
  // matrícula entre paréntesis. Con uno: "Alumno:" y "Matrícula:" por separado.
  const equipo = [{ nombre: portada.alumno, matricula: portada.matricula }, ...(portada.companeros ?? [])]
    .map((e) => ({ nombre: e.nombre?.trim() ?? '', matricula: e.matricula?.trim() ?? '' }))
    .filter((e) => e.nombre || e.matricula)
  const varios = equipo.length > 1
  const alumnos = varios
    ? [['Alumnos', equipo.map((e) => (e.nombre && e.matricula ? `${e.nombre} (${e.matricula})` : e.nombre || e.matricula))]]
    : [['Alumno', equipo[0]?.nombre], ['Matrícula', equipo[0]?.matricula]]
  const datos = [
    ['Materia', portada.materia],
    ['Tema', portada.titulo || tituloDocumento],
    [portada.tituloMaestro || 'Profesor', portada.maestro],
    ...alumnos,
    ['Grupo', portada.grupo],
  ].filter(([, valor]) => (Array.isArray(valor) ? valor.length > 0 : valor))
  const cierre = [portada.lugar, portada.fecha].filter(Boolean).join(', ')

  return (
    <section className="portada">
      {logos.length === 2 ? (
        // Dos logos: uno en cada esquina, a la misma altura.
        <div className="portada-encabezado">
          <img className="portada-logo" src={logos[0]} alt="" />
          <img className="portada-logo" src={logos[1]} alt="" />
        </div>
      ) : (
        logos[0] && <img className="portada-logo" src={logos[0]} alt="" />
      )}
      {(portada.institucion || portada.facultad) && (
        <div className="portada-institucion">
          {portada.institucion && <p className="portada-universidad">{portada.institucion}</p>}
          {portada.facultad && <p className="portada-facultad">{portada.facultad}</p>}
        </div>
      )}
      {portada.carrera && <p className="portada-carrera">{portada.carrera}</p>}
      <dl className="portada-datos">
        {datos.map(([etiqueta, valor]) => (
          <div key={etiqueta}>
            <dt>{etiqueta}:</dt>
            <dd>{Array.isArray(valor) ? valor.map((v, i) => <span key={i}>{v}</span>) : valor}</dd>
          </div>
        ))}
      </dl>
      {cierre && <p className="portada-fecha">{cierre}</p>}
    </section>
  )
}
