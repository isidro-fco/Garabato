import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function Salud() {
  const [estado, setEstado] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/salud', { credentials: 'include' })
      .then((res) => res.json())
      .then(setEstado)
      .catch((err) => setError(err.message))
  }, [])

  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem' }}>
      <h1>Garabato</h1>
      <p>Estado del backend:</p>
      <pre>{error ? `Error: ${error}` : estado ? JSON.stringify(estado) : 'Cargando…'}</pre>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Salud />} />
      </Routes>
    </BrowserRouter>
  )
}
