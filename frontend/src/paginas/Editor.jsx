import { ArrowLeft, BookMarked, Check, CircleAlert, FileDown, Loader2, Settings2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { obtenerDocumento } from '../api.js'
import EditorMarkdown from '../componentes/EditorMarkdown.jsx'
import { Cargando, MensajeError } from '../componentes/Estado.jsx'
import FuentesApa from '../componentes/FuentesApa.jsx'
import OpcionesDocumento from '../componentes/OpcionesDocumento.jsx'
import VincularTarea from '../componentes/VincularTarea.jsx'
import Escritorio from '../componentes/Escritorio.jsx'
import { Button } from '@/componentes/ui/button'
import { Checkbox } from '@/componentes/ui/checkbox'
import { Label } from '@/componentes/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/componentes/ui/sheet'
import { cn } from '@/lib/utils'
import { completarOpciones } from '../utils/opcionesDocumento.js'
import { recuperarRespaldo, useAutoguardado } from '../utils/useAutoguardado.js'
import { useCargar } from '../utils/useCargar.js'
import { useMediaQuery } from '../utils/useMediaQuery.js'

export default function Editor() {
  const { docId } = useParams()
  const { cargando, datos: doc, error } = useCargar(() => obtenerDocumento(docId), [docId])

  if (cargando) return <Cargando texto="Abriendo el documento…" />
  if (error) return <MensajeError error={error} />
  // key: si cambia el documento, el editor empieza de cero con sus datos.
  return <EditorDocumento key={doc.id} doc={doc} />
}

const ESTADOS = {
  guardado: ['Guardado', Check, 'text-muted-foreground'],
  pendiente: ['Cambios sin guardar', null, 'text-muted-foreground'],
  guardando: ['Guardando…', Loader2, 'text-muted-foreground [&_svg]:animate-spin'],
  error: ['No se pudo guardar. Reintentando…', CircleAlert, 'text-destructive'],
}

function EstadoGuardado({ estado }) {
  const [texto, Icono, clases] = ESTADOS[estado]
  return (
    <span className={cn('flex items-center gap-1 text-xs', clases)} aria-live="polite">
      {Icono && <Icono className="size-3.5" aria-hidden="true" />}
      {texto}
    </span>
  )
}

function EditorDocumento({ doc }) {
  const { usuario } = useOutletContext()
  const esMovil = useMediaQuery('(max-width: 767px)')
  // Cambios que no alcanzaron a guardarse la última vez (ver useAutoguardado).
  const [respaldo] = useState(() => recuperarRespaldo(doc))
  const inicial = { ...doc, ...respaldo }

  const [titulo, setTitulo] = useState(inicial.titulo)
  const [vinculo, setVinculo] = useState({ cursoId: inicial.cursoId, tareaId: inicial.tareaId })
  const [opciones, setOpciones] = useState(() => completarOpciones(inicial.opciones))
  const opcionesActuales = useRef(opciones)
  // Si nunca se ha configurado la portada, al abrir las opciones se llena sola.
  const [sinPortada] = useState(() => !inicial.opciones?.portada)

  // Qué se ve en las hojas mientras se escribe (no cambia el PDF).
  const [ver, setVer] = useState(leerVer)
  const cambiarVer = (campos) => setVer((actual) => {
    const nuevo = { ...actual, ...campos }
    guardarVer(nuevo)
    return nuevo
  })
  const [panel, setPanel] = useState(null) // null | 'opciones' | 'fuentes'
  const editor = useRef(null)
  const [exportando, setExportando] = useState(false)
  const [errorExportar, setErrorExportar] = useState(null)
  const { estado, cambiar, vaciar } = useAutoguardado(doc)

  useEffect(() => {
    if (respaldo) cambiar(respaldo)
  }, [respaldo, cambiar])

  useEffect(() => {
    document.title = `${titulo || 'Sin título'} · Garabato`
    return () => {
      document.title = 'Garabato'
    }
  }, [titulo])

  function cambiarOpciones(seccion, campos) {
    const nuevas = { ...opcionesActuales.current, [seccion]: { ...opcionesActuales.current[seccion], ...campos } }
    opcionesActuales.current = nuevas
    setOpciones(nuevas)
    cambiar({ opciones: nuevas })
    return nuevas
  }

  // Inserta una cita donde estaba el cursor y deja el cursor después.
  function insertarCita(cita) {
    if (esMovil) setPanel(null)
    // Después de cerrar la hoja de fuentes en celular.
    requestAnimationFrame(() => editor.current?.insertar(cita))
  }

  async function exportar() {
    // La pestaña se abre antes de esperar al guardado; si no, el navegador la bloquea.
    const pestana = window.open('', '_blank')
    setExportando(true)
    setErrorExportar(null)
    try {
      await vaciar() // que el PDF tenga los últimos cambios
      const url = `/documentos/${doc.id}/imprimir`
      if (pestana) pestana.location.href = url
      else window.location.href = url
    } catch {
      pestana?.close()
      setErrorExportar({ message: 'No se pudieron guardar los últimos cambios. Intenta de nuevo.' })
    } finally {
      setExportando(false)
    }
  }

  const PANELES = {
    opciones: {
      titulo: 'Opciones del documento',
      descripcion: 'Portada, encabezado, pie y formato del PDF.',
      contenido: (
        <OpcionesDocumento
          opciones={opciones}
          onCambiar={cambiarOpciones}
          cursoId={vinculo.cursoId}
          usuario={usuario}
          nuevo={sinPortada}
        />
      ),
    },
    fuentes: {
      titulo: 'Fuentes (APA 7)',
      descripcion: 'Cita tus fuentes y genera la sección de referencias.',
      contenido: (
        <FuentesApa
          fuentes={opciones.referencias.fuentes}
          nuevaPagina={opciones.referencias.nuevaPagina}
          onCambiar={(fuentes) => cambiarOpciones('referencias', { fuentes })}
          onNuevaPagina={(nuevaPagina) => cambiarOpciones('referencias', { nuevaPagina })}
          onCitar={insertarCita}
        />
      ),
    },
  }
  const abierto = PANELES[panel]
  const alternar = (nombre) => setPanel((actual) => (actual === nombre ? null : nombre))

  return (
    <div className="editor flex gap-4 md:h-[calc(100vh-4rem)]">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
            <Link to="/documentos"><ArrowLeft />Mis documentos</Link>
          </Button>
          <EstadoGuardado estado={estado} />
          <div className="ml-auto flex flex-wrap justify-end gap-2">
            <Button variant={panel === 'fuentes' ? 'secondary' : 'outline'} size="sm" aria-expanded={panel === 'fuentes'} onClick={() => alternar('fuentes')}>
              <BookMarked />Fuentes
            </Button>
            <Button variant={panel === 'opciones' ? 'secondary' : 'outline'} size="sm" aria-expanded={panel === 'opciones'} onClick={() => alternar('opciones')}>
              <Settings2 />Opciones
            </Button>
            <Button size="sm" onClick={exportar} disabled={exportando}>
              {exportando ? <Loader2 className="animate-spin" /> : <FileDown />}
              {exportando ? 'Preparando…' : 'Exportar PDF'}
            </Button>
          </div>
        </div>
        {errorExportar && <MensajeError error={errorExportar} onReintentar={null} />}

        <label className="sr-only" htmlFor="editor-titulo">Título</label>
        <input
          id="editor-titulo"
          className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground md:text-3xl"
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

        {(opciones.portada.activa || opciones.numeracion.activa) && (
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm" role="group" aria-label="Qué ocultar mientras escribes">
            {opciones.portada.activa && (
              <Casilla id="ocultar-portada" marcada={!ver.portada} onCambiar={(v) => cambiarVer({ portada: !v })}>
                Ocultar portada
              </Casilla>
            )}
            {opciones.numeracion.activa && (
              <Casilla id="ocultar-numeros" marcada={!ver.numeros} onCambiar={(v) => cambiarVer({ numeros: !v })}>
                Ocultar números de página
              </Casilla>
            )}
          </div>
        )}

        <Escritorio
          titulo={titulo}
          opciones={opciones}
          ver={ver}
          onClicHoja={() => editor.current?.enfocarAlFinal()}
          className="h-[70vh] min-h-0 rounded-xl border md:h-auto md:flex-1"
        >
          <EditorMarkdown
            ref={editor}
            id="editor-texto"
            etiqueta="Contenido del documento"
            valorInicial={inicial.contenido}
            onCambiar={(texto) => cambiar({ contenido: texto })}
          />
        </Escritorio>
      </div>

      {/* Escritorio: panel al lado, para ver los cambios en la vista previa. Celular: hoja. */}
      {abierto && !esMovil && (
        <aside aria-label={abierto.titulo} className="flex w-80 shrink-0 flex-col overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">{abierto.titulo}</h2>
            <Button variant="ghost" size="icon-sm" onClick={() => setPanel(null)} aria-label="Cerrar panel"><X /></Button>
          </div>
          <div className="overflow-y-auto px-4 py-4">{abierto.contenido}</div>
        </aside>
      )}
      {esMovil && (
        <Sheet open={!!abierto} onOpenChange={(abrir) => !abrir && setPanel(null)}>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>{abierto?.titulo}</SheetTitle>
              <SheetDescription>{abierto?.descripcion}</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-6">{abierto?.contenido}</div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}

// --- Lo que se ve en las hojas (se recuerda en este navegador) ---
const CLAVE_VER = 'garabato:ver-hojas'
const VER_BASE = { portada: true, numeros: true }

function leerVer() {
  try {
    return { ...VER_BASE, ...JSON.parse(localStorage.getItem(CLAVE_VER)) }
  } catch {
    return VER_BASE
  }
}

function guardarVer(ver) {
  try {
    localStorage.setItem(CLAVE_VER, JSON.stringify(ver))
  } catch {
    // Sin localStorage solo se pierde la comodidad.
  }
}

function Casilla({ id, marcada, onCambiar, children }) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={marcada} onCheckedChange={(v) => onCambiar(v === true)} />
      <Label htmlFor={id} className="font-normal text-muted-foreground">{children}</Label>
    </div>
  )
}
