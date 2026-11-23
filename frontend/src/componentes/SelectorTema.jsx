import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cambiarTema, NOMBRES_TEMA, sistemaEsOscuro, useTema } from '../utils/tema.js'

const OPCIONES = [
  { valor: 'sistema', nombre: NOMBRES_TEMA.sistema, descripcion: 'Igual que tu computadora o celular.', icono: Monitor },
  { valor: 'claro', nombre: NOMBRES_TEMA.claro, descripcion: 'Fondo blanco.', icono: Sun },
  { valor: 'oscuro', nombre: NOMBRES_TEMA.oscuro, descripcion: 'Fondo oscuro, cansa menos de noche.', icono: Moon },
]

// Tres tarjetas con una miniatura de cómo se ve cada tema. Cambia al instante.
export default function SelectorTema() {
  const { tema } = useTema()

  return (
    <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Tema">
      {OPCIONES.map(({ valor, nombre, descripcion, icono: Icono }) => {
        const activo = tema === valor
        // La miniatura de "Sistema" muestra el tema que tiene ahora el dispositivo.
        const miniOscura = valor === 'oscuro' || (valor === 'sistema' && sistemaEsOscuro())
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => cambiarTema(valor)}
            className={cn(
              'relative flex flex-col gap-2 rounded-xl border p-3 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50',
              activo && 'border-foreground ring-1 ring-foreground',
            )}
          >
            <Miniatura oscura={miniOscura} />
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Icono className="size-4" aria-hidden="true" />{nombre}
              {activo && <Check className="ml-auto size-4" aria-hidden="true" />}
            </span>
            <span className="text-xs text-muted-foreground">{descripcion}</span>
          </button>
        )
      })}
    </div>
  )
}

// Dibujo de la app: barra lateral y una hoja con renglones.
function Miniatura({ oscura }) {
  const c = oscura
    ? { fondo: '#16161d', barra: '#1d1c25', hoja: '#262530', linea: '#4f4d5c', titulo: '#ff5c57' }
    : { fondo: '#fcfbfd', barra: '#f4f3f7', hoja: '#ffffff', linea: '#dcdae2', titulo: '#d32f2f' }
  return (
    <span className="flex h-20 overflow-hidden rounded-lg border" style={{ background: c.fondo }} aria-hidden="true">
      <span className="w-1/4" style={{ background: c.barra }} />
      <span className="m-2 flex flex-1 flex-col gap-1.5 rounded-sm p-2 shadow-sm" style={{ background: c.hoja }}>
        <span className="h-1.5 w-1/2 rounded-full" style={{ background: c.titulo }} />
        <span className="h-1 w-full rounded-full" style={{ background: c.linea }} />
        <span className="h-1 w-5/6 rounded-full" style={{ background: c.linea }} />
        <span className="h-1 w-2/3 rounded-full" style={{ background: c.linea }} />
      </span>
    </span>
  )
}
