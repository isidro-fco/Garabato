import { Component } from 'react'
import { AlertCircle, Home, RotateCw } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Alert, AlertDescription } from '@/componentes/ui/alert'
import { Button } from '@/componentes/ui/button'
import { cn } from '@/lib/utils'

// Si una página falla al dibujarse (o no se pudo descargar su código, por
// ejemplo sin internet o después de un despliegue), se muestra un aviso con
// opciones en lugar de dejar la pantalla en blanco.
class Limite extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Error al mostrar la página:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    // Mensaje de Vite/Chrome/Firefox/Safari cuando no llega un import() diferido.
    const sinDescarga = /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(error.message ?? '')
    return (
      <div className={cn('mx-auto max-w-lg', this.props.className)}>
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription className="space-y-3">
            <p>
              {sinDescarga
                ? 'No se pudo cargar esta página. Revisa tu conexión a internet y vuelve a intentar.'
                : 'Algo salió mal al mostrar esta página. Tus documentos guardados no se perdieron.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                <RotateCw />Recargar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => window.location.assign('/')}>
                <Home />Ir al inicio
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }
}

// Al cambiar de página se limpia el error (key), para que el resto de la app siga usable.
export default function LimiteErrores({ children, className }) {
  const { pathname } = useLocation()
  return <Limite key={pathname} className={className}>{children}</Limite>
}
