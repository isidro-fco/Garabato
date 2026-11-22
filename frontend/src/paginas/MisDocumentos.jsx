import { FileText, Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { crearDocumento, eliminarDocumento, listarClases, listarDocumentos } from '../api.js'
import { Cargando, Encabezado, MensajeError, Vacio } from '../componentes/Estado.jsx'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/componentes/ui/alert-dialog'
import { Button } from '@/componentes/ui/button'
import { Card } from '@/componentes/ui/card'
import { haceCuanto } from '../utils/fechas.js'
import { useCargar } from '../utils/useCargar.js'

export default function MisDocumentos() {
  const navigate = useNavigate()
  const [recarga, setRecarga] = useState(0)
  const [creando, setCreando] = useState(false)
  const [porEliminar, setPorEliminar] = useState(null)
  const [errorAccion, setErrorAccion] = useState(null)
  const documentos = useCargar(listarDocumentos, [recarga])
  // Solo para mostrar el nombre de la materia; si Classroom falla, la lista sigue funcionando.
  const clases = useCargar(() => listarClases().catch(() => []), [])
  const nombreClase = new Map(clases.datos?.map((c) => [c.id, c.nombre]))

  async function nuevo() {
    setCreando(true)
    try {
      const doc = await crearDocumento()
      navigate(`/documentos/${doc.id}`)
    } catch (error) {
      setErrorAccion(error)
      setCreando(false)
    }
  }

  async function eliminar() {
    const doc = porEliminar
    setPorEliminar(null)
    try {
      await eliminarDocumento(doc.id)
      setRecarga((n) => n + 1)
    } catch (error) {
      setErrorAccion(error)
    }
  }

  return (
    <>
      <Encabezado
        titulo="Mis documentos"
        descripcion="Se guardan solos mientras escribes."
        accion={(
          <Button onClick={nuevo} disabled={creando}>
            {creando ? <Loader2 className="animate-spin" /> : <Plus />}
            {creando ? 'Creando…' : 'Nuevo documento'}
          </Button>
        )}
      />

      {errorAccion && <MensajeError error={errorAccion} className="mb-4" />}
      {documentos.cargando && <Cargando texto="Cargando tus documentos…" />}
      {documentos.error && <MensajeError error={documentos.error} />}
      {documentos.datos?.length === 0 && (
        <Vacio>
          Todavía no tienes documentos. Crea uno aquí o desde una tarea en{' '}
          <Link to="/clases" className="font-medium text-foreground underline underline-offset-4">Clases</Link>.
        </Vacio>
      )}

      {documentos.datos?.length > 0 && (
        <Card className="gap-0 py-0">
          <ul className="divide-y">
            {documentos.datos.map((doc) => (
              <li key={doc.id} className="flex items-center gap-2 pr-3">
                <Link to={`/documentos/${doc.id}`} className="group flex min-w-0 flex-1 items-center gap-3 px-4 py-3">
                  <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium group-hover:underline group-hover:underline-offset-4">{doc.titulo}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {doc.cursoId && `${nombreClase.get(doc.cursoId) ?? 'Clase de Classroom'} · `}
                      Editado {haceCuanto(doc.actualizadoEn)}
                    </span>
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setPorEliminar(doc)}
                  aria-label={`Eliminar ${doc.titulo}`}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <AlertDialog open={!!porEliminar} onOpenChange={(abierto) => !abierto && setPorEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar “{porEliminar?.titulo}”?</AlertDialogTitle>
            <AlertDialogDescription>El documento se borrará para siempre. No se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={eliminar}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
