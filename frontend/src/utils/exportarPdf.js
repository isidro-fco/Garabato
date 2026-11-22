import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import DocumentoImpreso from '../componentes/DocumentoImpreso.jsx'
import cssDocumento from '../documento.css?raw'
import { completarOpciones, FUENTES, MARGEN_CM, TAMANOS } from './opcionesDocumento.js'

// Texto seguro dentro de content: "..." en CSS.
function textoCss(texto) {
  return `"${String(texto).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s+/g, ' ').trim()}"`
}

const CAJA_NUMERO = {
  'pie-derecha': 'bottom-right',
  'pie-centro': 'bottom-center',
  'encabezado-derecha': 'top-right',
}

const CONTENIDO_NUMERO = {
  arabigo: 'counter(page)',
  romano: 'counter(page, lower-roman)',
  pagina: '"Página " counter(page)',
}

const TODAS_LAS_CAJAS = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']

// Reglas @page: tamaño, márgenes, encabezado, pie y numeración.
// El encabezado va arriba a la izquierda y el pie abajo a la izquierda;
// el número va donde elija el usuario, así nunca se enciman.
export function cssPaginas(opciones, tituloDocumento) {
  const { encabezado, pie, numeracion, portada, formato } = opciones
  const cajas = {}

  if (encabezado.activo) cajas['top-left'] = textoCss(encabezado.texto || tituloDocumento)
  if (pie.activo && pie.texto) cajas['bottom-left'] = textoCss(pie.texto)
  if (numeracion.activa) {
    cajas[CAJA_NUMERO[numeracion.posicion] ?? 'bottom-right'] = CONTENIDO_NUMERO[numeracion.estilo] ?? CONTENIDO_NUMERO.arabigo
  }

  // Las cajas del margen quedan fuera de .documento: la fuente va explícita.
  const fuente = (FUENTES[formato.fuente] ?? FUENTES.serif).css
  const reglasCajas = Object.entries(cajas)
    .map(([caja, contenido]) => `  @${caja} { content: ${contenido}; font-family: ${fuente}; font-size: 9pt; color: #555; }`)
    .join('\n')

  let css = `
@page {
  size: ${(TAMANOS[formato.tamano] ?? TAMANOS.carta).css};
  margin: ${MARGEN_CM}cm;
${reglasCajas}
}
`

  if (portada.activa) {
    // La portada no lleva encabezado, pie ni número.
    css += `
@page portada {
${TODAS_LAS_CAJAS.map((caja) => `  @${caja} { content: none; }`).join('\n')}
}
.portada { page: portada; }
`
    // Que la primera página después de la portada sea la 1.
    if (!numeracion.contarPortada) css += `.doc-cuerpo { counter-reset: page 1; }\n`
  }
  return css
}

export function htmlDocumento(doc, opciones) {
  return renderToStaticMarkup(
    createElement(DocumentoImpreso, { titulo: doc.titulo, contenido: doc.contenido, opciones }),
  )
}

// Divide el documento en páginas con Paged.js dentro de `destino`.
// Devuelve el número de páginas. Después basta con window.print().
export async function paginarDocumento(doc, destino) {
  const { Previewer } = await import('pagedjs')
  const opciones = completarOpciones(doc.opciones)
  const previewer = new Previewer()
  const flujo = await previewer.preview(
    htmlDocumento(doc, opciones),
    [{ 'documento.css': cssDocumento }, { 'paginas.css': cssPaginas(opciones, doc.titulo) }],
    destino,
  )
  return flujo.total
}

export function imprimir() {
  window.print()
}
