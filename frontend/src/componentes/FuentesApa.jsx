import { Pencil, Plus, Quote, Trash2, X } from 'lucide-react'
import { useId, useState } from 'react'
import Markdown from 'react-markdown'
import { Button } from '@/componentes/ui/button'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select'
import { Separator } from '@/componentes/ui/separator'
import { Switch } from '@/componentes/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/componentes/ui/tabs'
import { citaApa, fuenteVacia, letrasPorAnio, MESES, ordenarFuentes, referenciaApa, TIPOS_FUENTE } from '../utils/apa.js'

// Referencia o cita en Markdown dibujada en la interfaz (solo cursivas y enlaces).
function TextoApa({ markdown, className }) {
  return (
    <span className={className}>
      <Markdown
        allowedElements={['p', 'em', 'a']}
        unwrapDisallowed
        components={{
          p: ({ children }) => <span>{children}</span>,
          a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="underline [overflow-wrap:anywhere]">{children}</a>,
        }}
      >
        {markdown}
      </Markdown>
    </span>
  )
}

// fuentes: las fuentes del documento. onCambiar(fuentes) las guarda.
// onCitar(texto) inserta la cita donde está el cursor del editor.
export default function FuentesApa({ fuentes, nuevaPagina, onCambiar, onNuevaPagina, onCitar }) {
  const [editando, setEditando] = useState(null) // fuente en el formulario
  const [porBorrar, setPorBorrar] = useState(null)
  const idNuevaPagina = useId()
  const letras = letrasPorAnio(fuentes)

  function guardar(fuente) {
    const existe = fuentes.some((f) => f.id === fuente.id)
    onCambiar(existe ? fuentes.map((f) => (f.id === fuente.id ? fuente : f)) : [...fuentes, fuente])
    setEditando(null)
  }

  if (editando) {
    return <FormularioFuente inicial={editando} onGuardar={guardar} onCancelar={() => setEditando(null)} />
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Agrega tus fuentes y cítalas en el texto. La sección "Referencias" se genera sola al final del documento, en orden alfabético.
      </p>
      <Button size="sm" className="w-full" onClick={() => setEditando(fuenteVacia())}>
        <Plus />Agregar fuente
      </Button>

      {fuentes.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={idNuevaPagina} className="text-sm font-normal">Referencias en una página nueva</Label>
            <Switch id={idNuevaPagina} checked={nuevaPagina} onCheckedChange={onNuevaPagina} />
          </div>
          <Separator />
          <ul className="space-y-3">
            {ordenarFuentes(fuentes).map((fuente) => (
              <FuenteGuardada
                key={fuente.id}
                fuente={fuente}
                letra={letras.get(fuente.id)}
                confirmandoBorrar={porBorrar === fuente.id}
                onCitar={onCitar}
                onEditar={() => setEditando(fuente)}
                onBorrar={() => setPorBorrar(fuente.id)}
                onConfirmarBorrar={() => {
                  onCambiar(fuentes.filter((f) => f.id !== fuente.id))
                  setPorBorrar(null)
                }}
                onCancelarBorrar={() => setPorBorrar(null)}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function FuenteGuardada({ fuente, letra, confirmandoBorrar, onCitar, onEditar, onBorrar, onConfirmarBorrar, onCancelarBorrar }) {
  const [pagina, setPagina] = useState('')
  const idPagina = useId()
  const parentetica = citaApa(fuente, { pagina, letra })
  const narrativa = citaApa(fuente, { pagina, letra, narrativa: true })

  return (
    <li className="space-y-2 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-muted-foreground">{TIPOS_FUENTE[fuente.tipo]}</span>
        <div className="-mt-1 -mr-1 flex">
          <Button variant="ghost" size="icon-xs" onClick={onEditar} aria-label="Editar fuente"><Pencil /></Button>
          <Button variant="ghost" size="icon-xs" className="hover:text-destructive" onClick={onBorrar} aria-label="Borrar fuente"><Trash2 /></Button>
        </div>
      </div>
      <TextoApa markdown={referenciaApa(fuente, letra)} className="block pl-4 -indent-4 text-sm leading-snug" />

      {confirmandoBorrar ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm">
          <span>¿Borrar esta fuente? Las citas que ya están en el texto no se borran.</span>
          <Button size="xs" variant="destructive" onClick={onConfirmarBorrar}>Borrar</Button>
          <Button size="xs" variant="ghost" onClick={onCancelarBorrar}>Cancelar</Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor={idPagina} className="text-xs font-normal text-muted-foreground">Página (opcional)</Label>
            <Input id={idPagina} value={pagina} onChange={(e) => setPagina(e.target.value)} placeholder="15 o 15-17" className="h-7 w-28 text-xs" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button size="xs" variant="outline" onClick={() => onCitar(parentetica)} title="Insertar cita entre paréntesis">
              <Quote /><TextoApa markdown={parentetica} className="truncate" />
            </Button>
            <Button size="xs" variant="outline" onClick={() => onCitar(narrativa)} title="Insertar cita narrativa">
              <Quote /><TextoApa markdown={narrativa} className="truncate" />
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}

function Campo({ etiqueta, children }) {
  const id = useId()
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">{etiqueta}</Label>
      {children(id)}
    </div>
  )
}

function FormularioFuente({ inicial, onGuardar, onCancelar }) {
  const [fuente, setFuente] = useState(inicial)
  const nueva = inicial.titulo === ''
  const cambiar = (campos) => setFuente((f) => ({ ...f, ...campos }))
  const texto = (campo, etiqueta, extra = {}) => (
    <Campo etiqueta={etiqueta}>
      {(id) => <Input id={id} value={fuente[campo]} onChange={(e) => cambiar({ [campo]: e.target.value })} {...extra} />}
    </Campo>
  )
  const cambiarAutor = (i, campos) => cambiar({ autores: fuente.autores.map((a, j) => (j === i ? { ...a, ...campos } : a)) })

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (fuente.titulo.trim()) onGuardar(fuente)
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{nueva ? 'Nueva fuente' : 'Editar fuente'}</h3>
        <Button type="button" variant="ghost" size="icon-xs" onClick={onCancelar} aria-label="Cancelar"><X /></Button>
      </div>

      <Tabs value={fuente.tipo} onValueChange={(tipo) => cambiar({ tipo })}>
        <TabsList className="w-full">
          <TabsTrigger value="libro">Libro</TabsTrigger>
          <TabsTrigger value="articulo">Artículo</TabsTrigger>
          <TabsTrigger value="web">Web</TabsTrigger>
        </TabsList>
      </Tabs>

      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-xs text-muted-foreground">Autores (sin nombre si es una organización)</legend>
        {fuente.autores.map((autor, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input aria-label={`Apellidos del autor ${i + 1}`} placeholder="Apellidos u organización" value={autor.apellidos} onChange={(e) => cambiarAutor(i, { apellidos: e.target.value })} />
            <Input aria-label={`Nombres del autor ${i + 1}`} placeholder="Nombres" value={autor.nombres} onChange={(e) => cambiarAutor(i, { nombres: e.target.value })} />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              disabled={fuente.autores.length === 1}
              onClick={() => cambiar({ autores: fuente.autores.filter((_, j) => j !== i) })}
              aria-label={`Quitar autor ${i + 1}`}
            >
              <X />
            </Button>
          </div>
        ))}
        <Button type="button" variant="ghost" size="xs" onClick={() => cambiar({ autores: [...fuente.autores, { apellidos: '', nombres: '' }] })}>
          <Plus />Otro autor
        </Button>
      </fieldset>

      <Campo etiqueta="Título">
        {(id) => <Input id={id} required value={fuente.titulo} onChange={(e) => cambiar({ titulo: e.target.value })} />}
      </Campo>

      <div className="grid grid-cols-3 gap-2">
        {texto('anio', 'Año', { inputMode: 'numeric', placeholder: 's.f.', maxLength: 4 })}
        {fuente.tipo === 'web' && (
          <>
            <Campo etiqueta="Mes">
              {(id) => (
                <Select value={fuente.mes || 'ninguno'} onValueChange={(mes) => cambiar({ mes: mes === 'ninguno' ? '' : mes })}>
                  <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguno">—</SelectItem>
                    {MESES.map((mes, i) => <SelectItem key={mes} value={String(i + 1)}>{mes}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </Campo>
            {texto('dia', 'Día', { inputMode: 'numeric', maxLength: 2, disabled: !fuente.mes })}
          </>
        )}
        {fuente.tipo === 'libro' && texto('edicion', 'Edición', { inputMode: 'numeric', placeholder: '1' })}
      </div>

      {fuente.tipo === 'libro' && texto('editorial', 'Editorial')}
      {fuente.tipo === 'articulo' && (
        <>
          {texto('revista', 'Revista')}
          <div className="grid grid-cols-3 gap-2">
            {texto('volumen', 'Volumen')}
            {texto('numero', 'Número')}
            {texto('paginas', 'Páginas', { placeholder: '45-67' })}
          </div>
        </>
      )}
      {fuente.tipo === 'web' && texto('sitio', 'Nombre del sitio')}
      {texto('enlace', fuente.tipo === 'web' ? 'URL' : 'DOI o URL (opcional)', { placeholder: fuente.tipo === 'web' ? 'https://…' : '10.1234/abcd' })}

      <div className="space-y-1.5 rounded-lg bg-muted/60 p-3">
        <p className="text-xs text-muted-foreground">Así se verá la referencia:</p>
        <TextoApa markdown={referenciaApa(fuente)} className="block pl-4 -indent-4 font-serif text-sm leading-snug" />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!fuente.titulo.trim()}>{nueva ? 'Agregar' : 'Guardar cambios'}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancelar}>Cancelar</Button>
      </div>
    </form>
  )
}
