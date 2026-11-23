import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { listarClases, listarHorarios } from '../api.js'
import { Cargando, Encabezado, MensajeError, Vacio } from '../componentes/Estado.jsx'
import HorarioPintable from '../componentes/HorarioPintable.jsx'
import SelectorMaterias from '../componentes/SelectorMaterias.jsx'
import { soloActivas } from '../utils/materias.js'
import { useCargar } from '../utils/useCargar.js'

const cargarTodo = () => Promise.all([listarClases(), listarHorarios()])

export default function Configuracion() {
  const { materias, cambiarMaterias } = useOutletContext()
  const { cargando, datos, error } = useCargar(cargarTodo, [])
  const activas = datos && soloActivas(datos[0], materias)
  // El horario se guarda en cada trazo; aquí se conserva la versión más reciente.
  const [editado, setEditado] = useState(null)
  const horarios = editado ?? datos?.[1]

  return (
    <>
      <Encabezado titulo="Configuración" descripcion="Elige tus materias y pinta tu horario semanal." />
      {cargando && <Cargando texto="Cargando tus clases…" />}
      {error && <MensajeError error={error} />}
      {datos && (
        <div className="space-y-10">
          <section className="space-y-3" aria-labelledby="titulo-materias">
            <div className="space-y-1">
              <h2 id="titulo-materias" className="text-lg font-semibold tracking-tight">Materias</h2>
              <p className="text-sm text-muted-foreground">Solo las materias marcadas aparecen en tus clases, tu calendario y tu horario.</p>
            </div>
            {datos[0].length === 0
              ? <Vacio>No tienes clases activas en Classroom.</Vacio>
              : <SelectorMaterias clases={datos[0]} inicial={materias} onGuardar={cambiarMaterias} textoGuardar="Guardar materias" soloSiCambia={materias !== null} />}
          </section>

          <section className="space-y-3" aria-labelledby="titulo-horario">
            <h2 id="titulo-horario" className="text-lg font-semibold tracking-tight">Horario</h2>
            {/* key: si cambian las materias, la tabla se arma de nuevo con ellas. */}
            <HorarioPintable key={activas.map((c) => c.id).join()} clases={activas} horarios={horarios} onGuardado={setEditado} />
          </section>
        </div>
      )}
    </>
  )
}
