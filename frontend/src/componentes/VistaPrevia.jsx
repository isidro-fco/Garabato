import { useDeferredValue } from 'react'
import { cn } from '@/lib/utils'
import DocumentoImpreso from './DocumentoImpreso.jsx'

const SALTO = <div className="salto-pagina" aria-hidden="true"><span>Salto de página</span></div>

export default function VistaPrevia({ titulo, contenido, opciones, className }) {
  // Si el documento es largo, escribir no espera a que termine de dibujarse la vista previa.
  const diferido = useDeferredValue(contenido)
  const vacio = !diferido.trim() && !opciones.portada.activa && opciones.referencias.fuentes.length === 0

  return (
    <article className={cn('vista-previa overflow-y-auto rounded-xl border bg-card px-5 py-6 md:px-8', className)}>
      {vacio
        ? <p className="text-sm text-muted-foreground">La vista previa aparecerá aquí.</p>
        : <DocumentoImpreso titulo={titulo} contenido={diferido} opciones={opciones} separador={SALTO} />}
    </article>
  )
}
