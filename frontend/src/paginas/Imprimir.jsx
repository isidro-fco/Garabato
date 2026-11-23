import { ArrowLeft, Printer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { obtenerDocumento } from '../api.js'
import { Cargando, MensajeError } from '../componentes/Estado.jsx'
import { Button } from '@/componentes/ui/button'
import { imprimir, paginarDocumento } from '../utils/exportarPdf.js'
import { useCargar } from '../utils/useCargar.js'

// Vista de impresión: el documento dividido en páginas con Paged.js.
// Se abre en otra pestaña desde el editor y lanza el diálogo de impresión
// (ahí se elige "Guardar como PDF"). ?sinImprimir solo muestra las páginas.
export default function Imprimir() {
  const { docId } = useParams()
  const { colores } = useOutletContext()
  const [params] = useSearchParams()
  const { cargando, datos: doc, error } = useCargar(() => obtenerDocumento(docId), [docId])
  const destino = useRef(null)
  const iniciado = useRef(false)
  const [paginas, setPaginas] = useState(null)
  const [errorPaginas, setErrorPaginas] = useState(null)

  useEffect(() => {
    // Una sola vez por documento (en desarrollo React ejecuta los efectos dos veces).
    if (!doc || iniciado.current) return
    iniciado.current = true
    document.title = doc.titulo // Chrome lo usa como nombre del PDF
    paginarDocumento(doc, destino.current, colores)
      .then((total) => {
        setPaginas(total)
        if (!params.has('sinImprimir')) setTimeout(imprimir, 300)
      })
      .catch(setErrorPaginas)
    // colores: solo al paginar; si cambian después no se vuelve a paginar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, params])

  return (
    <div className="impresion min-h-screen bg-neutral-200">
      <div className="impresion-barra sticky top-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-background px-4 py-2.5 text-foreground">
        <span className="font-medium">{doc?.titulo ?? 'Documento'}</span>
        <span className="text-sm text-muted-foreground">
          {paginas == null ? 'Preparando páginas…' : `${paginas} ${paginas === 1 ? 'página' : 'páginas'}`}
        </span>
        <div className="ml-auto flex gap-2">
          {/* Navegación completa: Paged.js deja estilos globales que no deben quedarse en la app. */}
          <Button asChild variant="outline" size="sm">
            <a href={`/documentos/${docId}`}><ArrowLeft />Volver al editor</a>
          </Button>
          <Button size="sm" onClick={imprimir} disabled={paginas == null}>
            <Printer />Imprimir o guardar PDF
          </Button>
        </div>
      </div>

      {cargando && <div className="impresion-aviso mx-auto max-w-xl p-8"><Cargando texto="Abriendo el documento…" /></div>}
      {(error || errorPaginas) && (
        <div className="impresion-aviso mx-auto max-w-xl p-8"><MensajeError error={error ?? errorPaginas} /></div>
      )}
      <div ref={destino} className="impresion-paginas" />
    </div>
  )
}
