import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obtenerDocumento } from '../api.js'
import { Cargando, MensajeError } from '../componentes/Estado.jsx'
import VincularTarea from '../componentes/VincularTarea.jsx'
import VistaPrevia from '../componentes/VistaPrevia.jsx'
import { recuperarRespaldo, useAutoguardado } from '../utils/useAutoguardado.js'
import { useCargar } from '../utils/useCargar.js'

export default function Editor() {
  const { docId } = useParams()
  const { cargando, datos: doc, error } = useCargar(() => obtenerDocumento(docId), [docId])

  if (cargando) return <Cargando texto="Abriendo el documento…" />
  if (error) return <MensajeError error={error} />
  // key: si cambia el documento, el editor empieza de cero con sus datos.
  return <EditorDocumento key={doc.id} doc={doc} />
}

const TEXTO_ESTADO = {
  guardado: 'Guardado',
  pendiente: 'Cambios sin guardar',
  guardando: 'Guardando…',
  error: 'No se pudo guardar. Reintentando…',
}

function EditorDocumento({ doc }) {
  // Cambios que no alcanzaron a guardarse la última vez (ver useAutoguardado).
  const [respaldo] = useState(() => recuperarRespaldo(doc))
  const inicial = { ...doc, ...respaldo }

  const [titulo, setTitulo] = useState(inicial.titulo)
  const [contenido, setContenido] = useState(inicial.contenido)
  const [vinculo, setVinculo] = useState({ cursoId: inicial.cursoId, tareaId: inicial.tareaId })
  const [vista, setVista] = useState('escribir') // solo en celular
  const { estado, cambiar } = useAutoguardado(doc)

  useEffect(() => {
    if (respaldo) cambiar(respaldo)
  }, [respaldo, cambiar])

  useEffect(() => {
    document.title = `${titulo || 'Sin título'} · Garabato`
    return () => {
      document.title = 'Garabato'
    }
  }, [titulo])

  return (
    <div className="editor" data-vista={vista}>
      <div className="editor-barra">
        <Link to="/documentos" className="migas" style={{ margin: 0 }}>← Mis documentos</Link>
        <span className={`editor-estado${estado === 'error' ? ' texto-error' : ''}`} aria-live="polite">
          {TEXTO_ESTADO[estado]}
        </span>
      </div>

      <label className="sr-only" htmlFor="editor-titulo">Título</label>
      <input
        id="editor-titulo"
        className="editor-titulo"
        value={titulo}
        placeholder="Sin título"
        maxLength={200}
        onChange={(e) => {
          setTitulo(e.target.value)
          cambiar({ titulo: e.target.value.trim() || 'Sin título' })
        }}
      />

      <VincularTarea
        {...vinculo}
        onCambiar={(nuevo) => {
          setVinculo(nuevo)
          cambiar(nuevo)
        }}
      />

      <div className="editor-pestanas" role="tablist" aria-label="Vista">
        <button role="tab" aria-selected={vista === 'escribir'} onClick={() => setVista('escribir')}>Escribir</button>
        <button role="tab" aria-selected={vista === 'previa'} onClick={() => setVista('previa')}>Vista previa</button>
      </div>

      <div className="editor-paneles">
        <label className="sr-only" htmlFor="editor-texto">Contenido en Markdown</label>
        <textarea
          id="editor-texto"
          className="editor-texto"
          value={contenido}
          placeholder={'# Título\n\nEscribe en Markdown…'}
          spellCheck
          onChange={(e) => {
            setContenido(e.target.value)
            cambiar({ contenido: e.target.value })
          }}
        />
        <VistaPrevia contenido={contenido} />
      </div>
    </div>
  )
}
