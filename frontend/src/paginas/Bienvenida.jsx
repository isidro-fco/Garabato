import { listarClases } from '../api.js'
import { Cargando, MensajeError, Vacio } from '../componentes/Estado.jsx'
import SelectorMaterias from '../componentes/SelectorMaterias.jsx'
import { Button } from '@/componentes/ui/button'
import { useCargar } from '../utils/useCargar.js'

// Primer acceso: el usuario escoge qué materias de Classroom quiere ver.
// Después puede cambiarlas en Configuración.
// onGuardar(ids) guarda la selección; onOmitir() entra sin elegir (se muestran todas).
export default function Bienvenida({ usuario, onGuardar, onOmitir }) {
  const { cargando, datos: clases, error } = useCargar(listarClases, [])

  return (
    <main className="flex min-h-screen items-start justify-center bg-muted/40 px-4 py-10 sm:items-center">
      <div className="w-full max-w-2xl space-y-6 rounded-xl border bg-card p-5 shadow-xs sm:p-8">
        <header className="space-y-1.5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <img src="/logo.webp" alt="" width="24" height="24" className="size-6" />
            Garabato
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Hola, {usuario.nombre.split(' ')[0]}</h1>
          <p className="text-sm text-muted-foreground">
            Escoge las materias que estás cursando. Solo esas aparecerán en tus clases, tu calendario y tu horario.
            Puedes cambiarlas cuando quieras en Configuración.
          </p>
        </header>

        {cargando && <Cargando texto="Buscando tus clases en Classroom…" />}

        {error && (
          <div className="space-y-3">
            <MensajeError error={error} />
            <Button variant="ghost" size="sm" onClick={onOmitir}>Continuar sin elegir</Button>
          </div>
        )}

        {clases?.length === 0 && (
          <div className="space-y-3">
            <Vacio>No encontramos clases activas en tu Classroom.</Vacio>
            <Button onClick={onOmitir}>Continuar</Button>
          </div>
        )}

        {clases?.length > 0 && <SelectorMaterias clases={clases} inicial={null} onGuardar={onGuardar} textoGuardar="Continuar" />}
      </div>
    </main>
  )
}
