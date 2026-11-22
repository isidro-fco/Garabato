import { BookOpen, FileText } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import { Encabezado } from '../componentes/Estado.jsx'
import { Button } from '@/componentes/ui/button'

// Por ahora solo da la bienvenida; el calendario llega en la fase 6.
export default function Inicio() {
  const { usuario } = useOutletContext()
  const nombre = usuario.nombre.split(' ')[0]

  return (
    <>
      <Encabezado titulo={`Hola, ${nombre}`} descripcion="Aquí verás tu calendario de entregas y tu horario." />
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/clases"><BookOpen />Ver mis clases</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/documentos"><FileText />Mis documentos</Link>
        </Button>
      </div>
    </>
  )
}
