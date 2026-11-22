import { useEffect, useState } from 'react'

// Carga datos al montar el componente y cada vez que cambian las dependencias.
// Devuelve { cargando, datos, error }.
export function useCargar(cargar, dependencias) {
  const clave = JSON.stringify(dependencias)
  const [estado, setEstado] = useState({ clave: null, datos: null, error: null })

  useEffect(() => {
    let activo = true
    cargar()
      .then((datos) => activo && setEstado({ clave, datos, error: null }))
      .catch((error) => activo && setEstado({ clave, datos: null, error }))
    return () => {
      activo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])

  // Mientras llega la respuesta de las dependencias nuevas, se considera cargando.
  if (estado.clave !== clave) return { cargando: true, datos: null, error: null }
  return { cargando: false, datos: estado.datos, error: estado.error }
}
