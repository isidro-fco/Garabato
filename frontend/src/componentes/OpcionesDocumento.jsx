import { ImageUp, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { obtenerClase } from '../api.js'
import { Button } from '@/componentes/ui/button'
import { Checkbox } from '@/componentes/ui/checkbox'
import { Input } from '@/componentes/ui/input'
import { Label } from '@/componentes/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/componentes/ui/select'
import { Separator } from '@/componentes/ui/separator'
import { Switch } from '@/componentes/ui/switch'
import {
  fechaDeHoy,
  FUENTES,
  leerDatosAlumno,
  recordarDatosAlumno,
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

// Reduce el logo para que no pese en la base: máximo 600 px.
function leerLogo(archivo) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo)
    const imagen = new Image()
    imagen.onload = () => {
      const escala = Math.min(1, 600 / Math.max(imagen.width, imagen.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(imagen.width * escala)
      canvas.height = Math.round(imagen.height * escala)
      canvas.getContext('2d').drawImage(imagen, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      // PNG conserva la transparencia; las fotos pesan menos en JPEG.
      resolve(archivo.type === 'image/png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.9))
    }
    imagen.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }
    imagen.src = url
  })
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
  const [errorLogo, setErrorLogo] = useState(null)
  const archivoLogo = useRef(null)
  const idContarPortada = useId()
  const { portada, encabezado, pie, numeracion, formato } = opciones

  // onCambiar aplica los campos sobre la versión más reciente (puede haber
  // cambiado mientras se consultaba Classroom) y devuelve las opciones nuevas.
  function cambiar(seccion, campos) {
    const nuevas = onCambiar(seccion, campos)
    if (seccion === 'portada' && ('matricula' in campos || 'institucion' in campos || 'logo' in campos)) {
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

  async function subirLogo(evento) {
    const archivo = evento.target.files[0]
    evento.target.value = ''
    if (!archivo) return
    try {
      setErrorLogo(null)
      cambiar('portada', { logo: await leerLogo(archivo) })
    } catch (error) {
      setErrorLogo(error.message)
    }
  }

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
        {campoPortada('titulo', 'Título', { placeholder: 'El título del documento' })}
        {campoPortada('institucion', 'Institución')}
        {campoPortada('materia', 'Materia')}
        {campoPortada('maestro', 'Maestro')}
        {campoPortada('alumno', 'Alumno')}
        {campoPortada('matricula', 'Matrícula')}
        {campoPortada('fecha', 'Fecha')}

        <Campo etiqueta="Logo">
          <div className="flex flex-wrap items-center gap-2">
            {portada.logo && (
              <img src={portada.logo} alt="Logo actual" className="logo-miniatura h-9 max-w-24 rounded-md border bg-white object-contain p-0.5" />
            )}
            <Button variant="outline" size="sm" onClick={() => archivoLogo.current.click()} disabled={!portada.activa}>
              <ImageUp />{portada.logo ? 'Cambiar' : 'Subir imagen'}
            </Button>
            {portada.logo && (
              <Button variant="ghost" size="sm" onClick={() => cambiar('portada', { logo: null })} disabled={!portada.activa}>
                <Trash2 />Quitar
              </Button>
            )}
            <input ref={archivoLogo} type="file" accept="image/png,image/jpeg,image/webp" onChange={subirLogo} hidden />
          </div>
          {errorLogo && <p className="text-xs text-destructive">{errorLogo}</p>}
        </Campo>

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
