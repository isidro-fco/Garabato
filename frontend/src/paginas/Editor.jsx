import { Link, useSearchParams } from 'react-router-dom'

// Provisional: el editor se construye en la fase 4.
// Ya recibe ?curso= y ?tarea= desde la vista de la tarea.
export default function Editor() {
  const [params] = useSearchParams()
  const curso = params.get('curso')
  const tarea = params.get('tarea')

  return (
    <>
      <header className="encabezado">
        <h1>Nuevo documento</h1>
      </header>
      <p className="mensaje">El editor llega en la fase 4.</p>
      {curso && tarea && (
        <p style={{ marginTop: '1rem' }}>
          <Link to={`/clases/${curso}/tareas/${tarea}`}>← Volver a la tarea</Link>
        </p>
      )}
    </>
  )
}
