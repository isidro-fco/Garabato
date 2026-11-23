import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { listaReferencias } from '../utils/apa.js'
import { medidasHoja, variablesDocumento } from '../utils/opcionesDocumento.js'
import { Portada, Referencias } from './DocumentoImpreso.jsx'

// Espacio alrededor de las hojas, en px.
const ESPACIO = { escritorio: 24, celular: 8 }

const ROMANOS = [[10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']]
function romano(n) {
  let texto = ''
  for (const [valor, letras] of ROMANOS) while (n >= valor) { texto += letras; n -= valor }
  return n === 0 && texto ? texto : String(n)
}
function textoNumero(n, estilo) {
  if (estilo === 'romano') return n < 40 ? romano(n) : String(n)
  if (estilo === 'pagina') return `Página ${n}`
  return String(n)
}

// Las hojas del documento sobre un fondo gris, como en un procesador de textos:
// la portada (si está activa), el texto (children: el editor) y las referencias.
// Todas del tamaño real del documento, reducidas si no caben.
// La hoja del texto crece por páginas enteras; las líneas tenues son los cortes
// de página y cada página lleva su número como en el PDF (aproximado: el PDF
// reparte el espacio un poco distinto).
// ver: { portada, numeros } — lo que el alumno quiere ver mientras escribe.
// onClicHoja: clic en la parte vacía de la hoja del texto.
export default function Escritorio({ titulo, opciones, ver, onClicHoja, className, children }) {
  const escritorio = useRef(null)
  const texto = useRef(null)
  const [ancho, setAncho] = useState(0)
  const [altoTexto, setAltoTexto] = useState(0)

  useEffect(() => {
    const observador = new ResizeObserver(() => {
      setAncho(escritorio.current.clientWidth)
      setAltoTexto(texto.current.firstElementChild?.offsetHeight ?? 0)
    })
    observador.observe(escritorio.current)
    observador.observe(texto.current)
    if (texto.current.firstElementChild) observador.observe(texto.current.firstElementChild)
    return () => observador.disconnect()
  }, [])

  const espacio = ancho && ancho < 640 ? ESPACIO.celular : ESPACIO.escritorio
  // -2: el borde de la hoja; así nunca aparece la barra horizontal.
  const hoja = medidasHoja(opciones.formato, ancho - 2 * espacio - 2)
  const { portada, numeracion, referencias } = opciones
  const fuentes = listaReferencias(referencias.fuentes)

  const paginas = hoja.aEscala ? Math.max(1, Math.ceil(altoTexto / hoja.alto - 0.02)) : 1
  const verNumeros = ver.numeros && numeracion.activa && hoja.aEscala
  const primera = portada.activa && numeracion.contarPortada ? 2 : 1

  // Número de una página (top: dónde empieza esa página dentro de la hoja).
  const numero = (n, top) => {
    const arriba = numeracion.posicion === 'encabezado-derecha'
    const centro = numeracion.posicion === 'pie-centro'
    return (
      <span
        key={n}
        className="hoja-numero"
        style={{
          top: top + (arriba ? hoja.margen / 2 : hoja.alto - hoja.margen / 2),
          ...(centro ? { left: '50%', transform: 'translate(-50%, -50%)' } : { right: hoja.margen, transform: 'translateY(-50%)' }),
        }}
      >
        {textoNumero(n, numeracion.estilo)}
      </span>
    )
  }

  // Portada y referencias: el diseño del PDF a tamaño real, con zoom.
  const hojaFija = (contenido, etiqueta) => (
    <div
      className="hoja hoja-fija documento"
      aria-label={etiqueta}
      role="region"
      style={{
        ...variablesDocumento(opciones),
        width: `${hoja.tamano.anchoCm}cm`,
        minHeight: `${hoja.tamano.altoCm}cm`,
        zoom: hoja.escala,
      }}
    >
      {contenido}
    </div>
  )

  return (
    <div
      ref={escritorio}
      className={cn('escritorio overflow-y-auto bg-muted', className)}
      style={{ ...hoja.estilo, padding: `${espacio}px ${espacio}px 30vh`, gap: espacio }}
    >
      {ver.portada && portada.activa && hojaFija(<Portada portada={portada} tituloDocumento={titulo} />, 'Portada')}

      <div
        ref={texto}
        className="hoja hoja-texto"
        style={{
          minHeight: paginas * hoja.alto,
          backgroundImage: hoja.aEscala
            ? `repeating-linear-gradient(to bottom, transparent 0, transparent ${hoja.alto - 1}px, var(--border) ${hoja.alto - 1}px, var(--border) ${hoja.alto}px)`
            : 'none',
        }}
        onMouseDown={(e) => {
          // Debajo del texto: el cursor va al final, como en una hoja de verdad.
          if (e.target === e.currentTarget) {
            e.preventDefault()
            onClicHoja?.()
          }
        }}
      >
        {children}
        {verNumeros && Array.from({ length: paginas }, (_, i) => numero(primera + i, i * hoja.alto))}
      </div>

      {fuentes.length > 0 && hojaFija(<Referencias fuentes={fuentes} nuevaPagina={false} />, 'Referencias')}
    </div>
  )
}
