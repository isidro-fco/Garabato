import { Check, Loader2, RotateCcw } from 'lucide-react'
import { lazy, Suspense, useEffect, useId, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Button } from '@/componentes/ui/button'
import { Checkbox } from '@/componentes/ui/checkbox'
import { Label } from '@/componentes/ui/label'
import { Switch } from '@/componentes/ui/switch'
import { aGris, contarElegidos, ELEMENTOS, normalizar, usarColores } from '../utils/coloresMarkdown.js'
import { useTema } from '../utils/tema.js'
import { MensajeError } from './Estado.jsx'

// CodeMirror pesa: se descarga solo al abrir Configuración, no con la app.
const EditorMarkdown = lazy(() => import('./EditorMarkdown.jsx'))

const LOREM = `# Lorem ipsum dolor

Lorem ipsum dolor sit amet, **consectetur adipiscing** elit. Sed do *eiusmod tempor* incididunt ut ~~labore~~ et dolore magna aliqua. Ut enim ad [minim veniam](https://ejemplo.com), quis \`nostrud\` exercitation.

## Ullamco laboris

### Duis aute irure

#### Excepteur sint

##### Occaecat cupidatat

###### Sunt in culpa

- Duis aute irure dolor
- In reprehenderit in voluptate
- [x] Excepteur sint occaecat

1. Velit esse cillum
2. Dolore eu fugiat nulla

> Sunt in culpa qui officia deserunt mollit anim id est laborum.`

// Las variables de la hoja que necesita el editor (ver Escritorio.jsx), en chico.
const HOJA = {
  '--hoja-margen': '1.25rem',
  '--hoja-letra': '15px',
  '--hoja-alto': '0px',
  '--doc-fuente': "'Times New Roman', Times, 'Liberation Serif', serif",
  '--doc-interlineado': 1.5,
}

// Espera después del último cambio antes de guardar en la cuenta (el selector
// de color manda muchos cambios mientras se arrastra).
const ESPERA_GUARDAR = 600

// Colores de cada elemento de Markdown en el editor, con una vista previa en vivo.
// Se aplican al instante y se guardan en la cuenta del usuario (JSON en la base).
export default function ColoresMarkdown() {
  const contexto = useOutletContext()
  const [colores, setColores] = useState(() => normalizar(contexto.colores))
  const [estado, setEstado] = useState(null) // null | 'guardando' | 'guardado' | 'error'
  const [error, setError] = useState(null)
  const pendiente = useRef(null) // { temporizador, colores }
  const guardarEnCuenta = useRef(contexto.cambiarColores)
  useEffect(() => {
    guardarEnCuenta.current = contexto.cambiarColores
  })
  const [verMarcas, setVerMarcas] = useState(false)
  const { oscuro } = useTema()
  const idMarcas = useId()
  const idGrises = useId()
  const personalizados = contarElegidos(colores) > 0
  const { grises } = colores

  async function guardar(nuevos) {
    pendiente.current = null
    setEstado('guardando')
    setError(null)
    try {
      await guardarEnCuenta.current(nuevos)
      setEstado('guardado')
    } catch (err) {
      setEstado('error')
      setError(err)
    }
  }

  const cambiar = (nuevos) => {
    setColores(nuevos)
    usarColores(nuevos)
    setEstado('guardando')
    clearTimeout(pendiente.current?.temporizador)
    pendiente.current = { colores: nuevos, temporizador: setTimeout(() => guardar(nuevos), ESPERA_GUARDAR) }
  }

  // Si se sale de Configuración antes de que termine la espera, se guarda ya.
  useEffect(() => () => {
    if (!pendiente.current) return
    clearTimeout(pendiente.current.temporizador)
    guardarEnCuenta.current(pendiente.current.colores).catch(() => {})
  }, [])

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <div className="space-y-2">
        <div className="flex h-5 items-center justify-between text-xs text-muted-foreground" aria-live="polite">
          <span>Se guardan en tu cuenta.</span>
          {estado === 'guardando' && <span className="flex items-center gap-1"><Loader2 className="size-3.5 animate-spin" />Guardando…</span>}
          {estado === 'guardado' && <span className="flex items-center gap-1"><Check className="size-3.5" />Guardado</span>}
        </div>
        {error && <MensajeError error={error} onReintentar={() => guardar(colores)} />}
        <div className="flex items-start gap-3 rounded-xl border bg-card px-3 py-2.5">
          <Checkbox id={idGrises} checked={grises} onCheckedChange={(v) => cambiar({ ...colores, grises: v === true })} className="mt-0.5" />
          <Label htmlFor={idGrises} className="flex-col items-start gap-0 font-normal">
            <span>Escala de grises</span>
            <span className="text-xs text-muted-foreground">Todos los colores en tonos de gris, también en el PDF. Tus colores se conservan.</span>
          </Label>
        </div>
        <ul className="divide-y rounded-xl border bg-card aria-disabled:opacity-60" aria-disabled={grises || undefined}>
          {ELEMENTOS.map(([clave, nombre, claro, enOscuro]) => {
            const id = `color-${clave}`
            const valor = colores[clave]
            const actual = valor ?? (oscuro ? enOscuro : claro)
            return (
              <li key={clave} className="flex items-center gap-3 px-3 py-2">
                <input
                  id={id}
                  type="color"
                  value={grises ? aGris(actual) : actual}
                  disabled={grises}
                  title={grises ? 'Desactiva la escala de grises para elegir colores' : undefined}
                  onChange={(e) => cambiar({ ...colores, [clave]: e.target.value })}
                  className="size-8 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5 disabled:cursor-not-allowed"
                />
                <Label htmlFor={id} className="min-w-0 flex-1 flex-col items-start gap-0 font-normal">
                  <span>{nombre}</span>
                  <span className="text-xs text-muted-foreground">{valor ? valor.toUpperCase() : 'Predeterminado'}</span>
                </Label>
                {valor && (
                  <Button variant="ghost" size="icon-sm" onClick={() => cambiar({ ...colores, [clave]: null })} aria-label={`Restablecer el color de ${nombre.toLowerCase()}`} title="Volver al color predeterminado">
                    <RotateCcw />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
        {personalizados && (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => cambiar({ ...Object.fromEntries(ELEMENTOS.map(([c]) => [c, null])), grises })}>
            <RotateCcw />Restablecer todos
          </Button>
        )}
      </div>

      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Vista previa</p>
          <div className="flex items-center gap-2">
            <Switch id={idMarcas} checked={verMarcas} onCheckedChange={setVerMarcas} size="sm" />
            <Label htmlFor={idMarcas} className="font-normal">Ver símbolos de Markdown</Label>
          </div>
        </div>
        <div className="rounded-xl border bg-muted p-3 sm:p-4">
          <div className="hoja vista-colores" style={HOJA}>
            <Suspense fallback={<p className="p-5 text-sm text-muted-foreground">Cargando vista previa…</p>}>
              <EditorMarkdown id="vista-colores" etiqueta="Vista previa de los colores" valorInicial={LOREM} verMarcas={verMarcas} />
            </Suspense>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Puedes escribir en la vista previa para probar; no se guarda. El PDF usa los colores del tema claro (se puede desactivar en las opciones de cada documento).
        </p>
      </div>
    </div>
  )
}
