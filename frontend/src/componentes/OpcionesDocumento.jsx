import { Eraser, ImageUp, Loader2, RefreshCw, Trash2, UserPlus, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { obtenerClase } from '../api.js'
import { leerLogo, quitarFondo } from '../utils/imagenes.js'
import { Button } from '@/componentes/ui/button'
import { Checkbox } from '@/componentes/ui/checkbox'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select'
import { Separator } from '@/componentes/ui/separator'
import { Switch } from '@/componentes/ui/switch'
import { cn } from '@/lib/utils'
import {
  fechaDeHoy,
  FUENTES,
  leerDatosAlumno,
  CAMPOS_ALUMNO,
  recordarDatosAlumno,
  TITULOS_MAESTRO,
  TAMANOS,
} from '../utils/opcionesDocumento.js'

// Datos de la portada a partir de la clase vinculada, el usuario y lo que
// el alumno capturó antes (matrícula, institución y logo).
async function datosAutomaticos({ cursoId, usuario }) {
  const datos = { alumno: usuario.nombre, fecha: fechaDeHoy(), ...leerDatosAlumno() }
  if (cursoId) {
    try {
      const clase = await obtenerClase(cursoId)
      datos.materia = clase.nombre
      datos.maestro = clase.maestros.map((m) => m.nombre).join(', ')
    } catch {
      // Sin Classroom se llena lo demás.
    }
  }
  return datos
}

// Encabezado de cada sección con su interruptor.
function Seccion({ titulo, activa, onActivar, children }) {
  const id = useId()
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-semibold">{titulo}</Label>
        {onActivar && <Switch id={id} checked={activa} onCheckedChange={onActivar} />}
      </div>
      {children}
    </section>
  )
}

function Campo({ etiqueta, children }) {
  const id = useId()
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">{etiqueta}</Label>
      {typeof children === 'function' ? children(id) : children}
    </div>
  )
}

function Opciones({ valor, onCambiar, opciones, disabled, etiqueta }) {
  return (
    <Campo etiqueta={etiqueta}>
      {(id) => (
        <Select value={String(valor)} onValueChange={onCambiar} disabled={disabled}>
          <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {opciones.map(([v, texto]) => <SelectItem key={v} value={String(v)}>{texto}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
    </Campo>
  )
}

export default function OpcionesDocumento({ opciones, onCambiar, cursoId, usuario, nuevo }) {
  const [rellenando, setRellenando] = useState(false)
  const idContarPortada = useId()
  const { portada, encabezado, pie, numeracion, formato } = opciones

  // onCambiar aplica los campos sobre la versión más reciente (puede haber
  // cambiado mientras se consultaba Classroom) y devuelve las opciones nuevas.
  function cambiar(seccion, campos) {
    const nuevas = onCambiar(seccion, campos)
    if (seccion === 'portada' && CAMPOS_ALUMNO.some((c) => c in campos)) {
      recordarDatosAlumno(nuevas.portada)
    }
  }

  async function rellenar() {
    setRellenando(true)
    const datos = await datosAutomaticos({ cursoId, usuario })
    setRellenando(false)
    return datos
  }

  // La primera vez que se abren las opciones de un documento, se llena la portada sola.
  const rellenoInicial = useRef(false)
  useEffect(() => {
    if (!nuevo || rellenoInicial.current) return
    rellenoInicial.current = true
    rellenar().then((datos) => cambiar('portada', { ...datos, activa: true }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nuevo])

  const campoPortada = (campo, etiqueta, extra = {}) => (
    <Campo etiqueta={etiqueta}>
      {(id) => (
        <Input
          id={id}
          value={portada[campo]}
          onChange={(e) => cambiar('portada', { [campo]: e.target.value })}
          disabled={!portada.activa}
          {...extra}
        />
      )}
    </Campo>
  )

  return (
    <div className="space-y-5">
      <Seccion titulo="Portada" activa={portada.activa} onActivar={(v) => cambiar('portada', { activa: v })}>
        {campoPortada('institucion', 'Institución')}
        {campoPortada('facultad', 'Facultad')}
        {campoPortada('carrera', 'Carrera')}
        {campoPortada('materia', 'Materia')}
        {campoPortada('titulo', 'Tema', { placeholder: 'El título del documento' })}
        <div className="grid grid-cols-[7.5rem_1fr] gap-2">
          <Opciones
            etiqueta="Se muestra como"
            valor={portada.tituloMaestro}
            onCambiar={(v) => cambiar('portada', { tituloMaestro: v })}
            opciones={TITULOS_MAESTRO.map((t) => [t, t])}
            disabled={!portada.activa}
          />
          {campoPortada('maestro', 'Nombre')}
        </div>
        <div className="grid grid-cols-[1fr_6.5rem] gap-2">
          {campoPortada('alumno', 'Alumno')}
          {campoPortada('matricula', 'Matrícula')}
        </div>
        <Companeros
          lista={portada.companeros ?? []}
          deshabilitado={!portada.activa}
          onCambiar={(companeros) => cambiar('portada', { companeros })}
        />
        {campoPortada('grupo', 'Grupo')}
        {campoPortada('lugar', 'Lugar', { placeholder: 'Ensenada, Baja California' })}
        {campoPortada('fecha', 'Fecha')}

        <CampoLogo
          etiqueta="Logo"
          valor={portada.logo}
          deshabilitado={!portada.activa}
          onCambiar={(logo) => cambiar('portada', { logo })}
        />
        <CampoLogo
          etiqueta="Segundo logo (opcional)"
          ayuda="Con dos logos, cada uno va en una esquina superior de la portada, a la misma altura."
          valor={portada.logo2}
          deshabilitado={!portada.activa}
          onCambiar={(logo2) => cambiar('portada', { logo2 })}
        />

        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          disabled={!portada.activa || rellenando}
          onClick={async () => {
            const { materia, maestro, alumno } = await rellenar()
            cambiar('portada', { materia, maestro, alumno })
          }}
        >
          {rellenando ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          {rellenando ? 'Consultando Classroom…' : 'Rellenar con datos de Classroom'}
        </Button>
      </Seccion>

      <Separator />
      <Seccion titulo="Encabezado" activa={encabezado.activo} onActivar={(v) => cambiar('encabezado', { activo: v })}>
        <Campo etiqueta="Texto (arriba a la izquierda)">
          {(id) => (
            <Input
              id={id}
              value={encabezado.texto}
              placeholder="El título del documento"
              onChange={(e) => cambiar('encabezado', { texto: e.target.value })}
              disabled={!encabezado.activo}
            />
          )}
        </Campo>
      </Seccion>

      <Separator />
      <Seccion titulo="Pie de página" activa={pie.activo} onActivar={(v) => cambiar('pie', { activo: v })}>
        <Campo etiqueta="Texto (abajo a la izquierda)">
          {(id) => (
            <Input
              id={id}
              value={pie.texto}
              placeholder={portada.alumno || 'Por ejemplo, tu nombre'}
              onChange={(e) => cambiar('pie', { texto: e.target.value })}
              disabled={!pie.activo}
            />
          )}
        </Campo>
      </Seccion>

      <Separator />
      <Seccion titulo="Numeración de páginas" activa={numeracion.activa} onActivar={(v) => cambiar('numeracion', { activa: v })}>
        <Opciones
          etiqueta="Posición"
          valor={numeracion.posicion}
          onCambiar={(v) => cambiar('numeracion', { posicion: v })}
          disabled={!numeracion.activa}
          opciones={[['pie-derecha', 'Pie, a la derecha'], ['pie-centro', 'Pie, al centro'], ['encabezado-derecha', 'Encabezado, a la derecha']]}
        />
        <Opciones
          etiqueta="Estilo"
          valor={numeracion.estilo}
          onCambiar={(v) => cambiar('numeracion', { estilo: v })}
          disabled={!numeracion.activa}
          opciones={[['arabigo', '1, 2, 3'], ['romano', 'i, ii, iii'], ['pagina', 'Página 1, Página 2']]}
        />
        {portada.activa && (
          <div className="flex items-center gap-2">
            <Checkbox
              id={idContarPortada}
              checked={numeracion.contarPortada}
              onCheckedChange={(v) => cambiar('numeracion', { contarPortada: v === true })}
              disabled={!numeracion.activa}
            />
            <Label htmlFor={idContarPortada} className="text-sm font-normal">Contar la portada como página 1</Label>
          </div>
        )}
      </Seccion>

      <Separator />
      <Seccion titulo="Formato">
        <Opciones
          etiqueta="Tamaño de hoja"
          valor={formato.tamano}
          onCambiar={(v) => cambiar('formato', { tamano: v })}
          opciones={Object.entries(TAMANOS).map(([clave, t]) => [clave, t.nombre])}
        />
        <Opciones
          etiqueta="Fuente"
          valor={formato.fuente}
          onCambiar={(v) => cambiar('formato', { fuente: v })}
          opciones={Object.entries(FUENTES).map(([clave, f]) => [clave, f.nombre])}
        />
        <Opciones
          etiqueta="Interlineado"
          valor={formato.interlineado}
          onCambiar={(v) => cambiar('formato', { interlineado: Number(v) })}
          opciones={[[1.15, 'Sencillo (1.15)'], [1.5, '1.5'], [2, 'Doble']]}
        />
      </Seccion>
    </div>
  )
}

// Un logo de la portada: subir, quitar el fondo liso (blanco de un JPG, por
// ejemplo) y quitar. Las imágenes sin fondo (PNG o WebP) conservan su transparencia.
function CampoLogo({ etiqueta, ayuda, valor, deshabilitado, onCambiar }) {
  const archivo = useRef(null)
  const [trabajando, setTrabajando] = useState(false)
  const [aviso, setAviso] = useState(null) // { texto, error }

  async function procesar(tarea) {
    setTrabajando(true)
    setAviso(null)
    try {
      await tarea()
    } catch (error) {
      setAviso({ texto: error.message, error: true })
    } finally {
      setTrabajando(false)
    }
  }

  const subir = (evento) => {
    const elegido = evento.target.files[0]
    evento.target.value = ''
    if (elegido) procesar(async () => onCambiar(await leerLogo(elegido)))
  }

  const sinFondo = () => procesar(async () => {
    const resultado = await quitarFondo(valor)
    if (resultado) {
      onCambiar(resultado)
      setAviso({ texto: 'Fondo quitado.' })
    } else {
      setAviso({ texto: 'No se encontró un fondo de un solo color para quitar.' })
    }
  })

  return (
    <Campo etiqueta={etiqueta}>
      <div className="flex flex-wrap items-center gap-2">
        {valor && (
          // Cuadros de fondo: así se nota si la imagen tiene transparencia.
          <img src={valor} alt={`${etiqueta}: imagen actual`} className="fondo-cuadros h-10 max-w-24 rounded-md border object-contain p-0.5" />
        )}
        <Button variant="outline" size="sm" onClick={() => archivo.current.click()} disabled={deshabilitado || trabajando}>
          {trabajando ? <Loader2 className="animate-spin" /> : <ImageUp />}{valor ? 'Cambiar' : 'Subir imagen'}
        </Button>
        {valor && (
          <>
            <Button variant="ghost" size="sm" onClick={sinFondo} disabled={deshabilitado || trabajando} title="Vuelve transparente el fondo de un solo color">
              <Eraser />Quitar fondo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onCambiar(null)} disabled={deshabilitado || trabajando} aria-label={`Quitar ${etiqueta.toLowerCase()}`}>
              <Trash2 />Quitar
            </Button>
          </>
        )}
        <input ref={archivo} type="file" accept="image/png,image/jpeg,image/webp" onChange={subir} hidden />
      </div>
      {ayuda && <p className="text-xs text-muted-foreground">{ayuda}</p>}
      {aviso && <p className={cn('text-xs', aviso.error ? 'text-destructive' : 'text-muted-foreground')} aria-live="polite">{aviso.texto}</p>}
    </Campo>
  )
}

// Más estudiantes en la portada (trabajos en equipo): nombre y matrícula de cada uno.
function Companeros({ lista, deshabilitado, onCambiar }) {
  const ultimo = useRef(null)
  const agregado = useRef(false)
  // Al agregar, el cursor va al nombre del nuevo estudiante.
  useEffect(() => {
    if (agregado.current) ultimo.current?.focus()
    agregado.current = false
  }, [lista.length])

  const cambiarUno = (i, campos) => onCambiar(lista.map((c, j) => (j === i ? { ...c, ...campos } : c)))

  return (
    <>
      {lista.map((companero, i) => (
        <div key={i} className="grid grid-cols-[1fr_6.5rem_auto] items-end gap-2">
          <Campo etiqueta={`Estudiante ${i + 2}`}>
            {(id) => (
              <Input
                id={id}
                ref={i === lista.length - 1 ? ultimo : undefined}
                value={companero.nombre}
                onChange={(e) => cambiarUno(i, { nombre: e.target.value })}
                disabled={deshabilitado}
              />
            )}
          </Campo>
          <Campo etiqueta="Matrícula">
            {(id) => (
              <Input id={id} value={companero.matricula} onChange={(e) => cambiarUno(i, { matricula: e.target.value })} disabled={deshabilitado} />
            )}
          </Campo>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCambiar(lista.filter((_, j) => j !== i))}
            disabled={deshabilitado}
            aria-label={`Quitar estudiante ${i + 2}`}
          >
            <X />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="justify-self-start"
        onClick={() => {
          agregado.current = true
          onCambiar([...lista, { nombre: '', matricula: '' }])
        }}
        disabled={deshabilitado || lista.length >= 9}
      >
        <UserPlus />Agregar estudiante
      </Button>
    </>
  )
}
