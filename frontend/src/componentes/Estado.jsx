import { AlertCircle, Loader2, RotateCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, AlertDescription } from '@/componentes/ui/alert'
import { Badge } from '@/componentes/ui/badge'
import { Button } from '@/componentes/ui/button'
import { cn } from '@/lib/utils'

// Mensajes de carga y de error que comparten todas las páginas.

// Si tarda más de unos segundos, casi siempre es el servidor despertando.
const AVISO_LENTO = 'Está tardando más de lo normal. Si nadie usó la app en un rato, el servidor tarda hasta un minuto en despertar.'

export function Cargando({ texto = 'Cargando…', className }) {
  const [lento, setLento] = useState(false)
  useEffect(() => {
    const temporizador = setTimeout(() => setLento(true), 5000)
    return () => clearTimeout(temporizador)
  }, [])

  return (
    <div className={cn('space-y-1.5 text-sm text-muted-foreground', className)} aria-live="polite">
      <p className="flex items-center gap-2">
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
        {texto}
      </p>
      {lento && <p className="max-w-md pl-6 text-xs">{AVISO_LENTO}</p>}
    </div>
  )
}

const MENSAJES = {
  sin_permiso: 'Google no dio permiso para leer Classroom con esta cuenta. Si es una cuenta escolar, puede que tu institución bloquee apps externas.',
  no_encontrado: 'No se encontró. Puede que ya no tengas acceso a esta clase o tarea.',
  limite: 'Google está recibiendo demasiadas peticiones. Intenta de nuevo en un momento.',
  classroom: 'No se pudo consultar Google Classroom. Intenta de nuevo en un momento.',
  red: 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.',
  servidor: 'El servidor no responde. Puede estar despertando; intenta de nuevo en unos segundos.',
}

// Errores que se pueden arreglar con solo volver a intentar.
const TEMPORALES = new Set(['limite', 'classroom', 'red', 'servidor'])

// onReintentar: qué hacer al pulsar "Reintentar" (por defecto, recargar la página).
// null cuando el error es de una acción (crear, borrar…): basta con volver a pulsarla.
export function MensajeError({ error, className, onReintentar = () => window.location.reload() }) {
  const temporal = TEMPORALES.has(error?.codigo) || error?.status >= 500
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle />
      <AlertDescription className="[&_p:not(:last-child)]:mb-2">
        <p>{MENSAJES[error?.codigo] ?? error?.message ?? 'Algo salió mal.'}</p>
        {temporal && onReintentar && (
          <Button size="sm" variant="outline" onClick={onReintentar}>
            <RotateCw />Reintentar
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

export function Vacio({ children, className }) {
  return (
    <div className={cn('rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground', className)}>
      {children}
    </div>
  )
}

const TONOS = {
  ok: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  aviso: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  alerta: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
}

export function Etiqueta({ texto, tono }) {
  return (
    <Badge variant={tono ? 'secondary' : 'outline'} className={cn(TONOS[tono])}>
      {texto}
    </Badge>
  )
}

// Título de página con descripción y una acción opcional a la derecha.
export function Encabezado({ titulo, descripcion, accion, children }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descripcion && <p className="text-sm text-muted-foreground">{descripcion}</p>}
        {children}
      </div>
      {accion}
    </header>
  )
}

// Ruta de navegación: [['Clases', '/clases'], ['Materia']]
export function Migas({ items }) {
  return (
    <nav aria-label="Ruta" className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
      {items.map(([texto, ruta], i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden="true">/</span>}
          {ruta ? <Link to={ruta} className="hover:text-foreground hover:underline">{texto}</Link> : <span className="text-foreground">{texto}</span>}
        </span>
      ))}
    </nav>
  )
}
