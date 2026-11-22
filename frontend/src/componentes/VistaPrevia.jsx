import { useDeferredValue } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// remark-gfm agrega tablas, listas de tareas, tachado y enlaces automáticos.
const PLUGINS = [remarkGfm]

const COMPONENTES = {
  a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
}

export default function VistaPrevia({ contenido }) {
  // Si el documento es largo, escribir no espera a que termine de dibujarse la vista previa.
  const diferido = useDeferredValue(contenido)

  return (
    <article className="vista-previa">
      {diferido.trim()
        ? <Markdown remarkPlugins={PLUGINS} components={COMPONENTES}>{diferido}</Markdown>
        : <p className="suave">La vista previa aparecerá aquí.</p>}
    </article>
  )
}
