// Tema de la app: 'sistema' (sigue al sistema operativo), 'claro' u 'oscuro'.
// Se guarda en este navegador (cada dispositivo puede tener el suyo) y se
// aplica con la clase .dark en <html>, que es la que usa shadcn/ui.
import { useSyncExternalStore } from 'react'

export const TEMAS = ['sistema', 'claro', 'oscuro']
export const NOMBRES_TEMA = { sistema: 'Sistema', claro: 'Claro', oscuro: 'Oscuro' }
const CLAVE = 'garabato:tema'
const sistemaOscuro = window.matchMedia('(prefers-color-scheme: dark)')
const avisar = () => window.dispatchEvent(new Event('garabato:tema'))

export function leerTema() {
  try {
    const tema = localStorage.getItem(CLAVE)
    return TEMAS.includes(tema) ? tema : 'sistema'
  } catch {
    return 'sistema'
  }
}

export const sistemaEsOscuro = () => sistemaOscuro.matches
const esOscuro = (tema) => tema === 'oscuro' || (tema === 'sistema' && sistemaOscuro.matches)

function aplicar() {
  document.documentElement.classList.toggle('dark', esOscuro(leerTema()))
  avisar()
}

export function cambiarTema(tema) {
  try {
    localStorage.setItem(CLAVE, tema)
  } catch {
    // Sin localStorage el tema dura hasta recargar.
    document.documentElement.classList.toggle('dark', esOscuro(tema))
    return avisar()
  }
  aplicar()
}

// Al abrir la app; también si cambia el tema del sistema o en otra pestaña.
export function iniciarTema() {
  aplicar()
  sistemaOscuro.addEventListener('change', aplicar)
  window.addEventListener('storage', (e) => {
    if (e.key === CLAVE) aplicar()
  })
}

const suscribir = (aviso) => {
  window.addEventListener('garabato:tema', aviso)
  return () => window.removeEventListener('garabato:tema', aviso)
}

// { tema: lo elegido, oscuro: si ahora se ve oscuro }
export function useTema() {
  const tema = useSyncExternalStore(suscribir, leerTema)
  const oscuro = useSyncExternalStore(suscribir, () => document.documentElement.classList.contains('dark'))
  return { tema, oscuro }
}
