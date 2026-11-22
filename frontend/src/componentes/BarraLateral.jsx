import { BookOpen, FileText, House, LogOut, Settings } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { cerrarSesion } from '../api.js'
import { Avatar, AvatarFallback, AvatarImage } from '@/componentes/ui/avatar'
import { Button } from '@/componentes/ui/button'
import { cn } from '@/lib/utils'

const ENLACES = [
  ['/', 'Inicio', House],
  ['/clases', 'Clases', BookOpen],
  ['/documentos', 'Documentos', FileText],
  ['/configuracion', 'Configuración', Settings],
]

const iniciales = (nombre) => nombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()

// Barra lateral en escritorio; barra superior en celular.
export default function BarraLateral({ usuario }) {
  const navigate = useNavigate()

  async function salir() {
    await cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sticky top-0 z-10 flex items-center gap-2 border-b bg-sidebar px-3 py-2 md:h-screen md:flex-col md:items-stretch md:gap-6 md:border-r md:border-b-0 md:px-3 md:py-5">
      <Link to="/" className="hidden px-2 text-lg font-semibold tracking-tight md:block">Garabato</Link>

      <nav aria-label="Principal" className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] md:flex-none md:flex-col">
        {ENLACES.map(([ruta, texto, Icono]) => (
          <NavLink
            key={ruta}
            to={ruta}
            end={ruta === '/'}
            title={texto}
            className={({ isActive }) => cn(
              'flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground',
              isActive && 'bg-sidebar-accent font-medium text-foreground',
            )}
          >
            {({ isActive }) => (
              <>
                <Icono className="size-4" aria-hidden="true" />
                {/* En pantallas angostas solo la sección actual muestra su nombre. */}
                <span className={cn(!isActive && 'sr-only sm:not-sr-only')}>{texto}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-2 md:mt-auto md:flex-col md:items-stretch md:gap-3">
        <div className="flex min-w-0 items-center gap-2 md:px-2" title={usuario.correo}>
          <Avatar className="size-7">
            {usuario.foto && <AvatarImage src={usuario.foto} alt="" referrerPolicy="no-referrer" />}
            <AvatarFallback className="text-xs">{iniciales(usuario.nombre)}</AvatarFallback>
          </Avatar>
          <span className="hidden truncate text-sm md:inline">{usuario.nombre}</span>
        </div>
        <Button variant="outline" size="sm" onClick={salir} aria-label="Cerrar sesión">
          <LogOut aria-hidden="true" />
          <span className="hidden md:inline">Cerrar sesión</span>
        </Button>
      </div>
    </aside>
  )
}
