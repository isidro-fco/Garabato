// Colores de los elementos de Markdown en el editor (vista en vivo).
// - La paleta predeterminada está en paleta-markdown.json (un color para tema
//   claro y otro para oscuro) y se aplica como variables --md-*-base.
// - Los colores que elige el usuario se guardan en su cuenta (columna JSONB
//   usuarios.colores, PUT /api/yo/colores) como { clave: "#rrggbb" } y se
//   aplican como --md-*. localStorage guarda una copia para pintarlos antes de
//   que responda el servidor.
// - { grises: true } muestra todos los colores (elegidos o de la paleta) en
//   escala de grises, con la misma luminosidad; los colores no se pierden.
// Los usan las clases cm-vv-* de index.css y el PDF (cssColores, siempre con
// los colores del tema claro porque la hoja es blanca).
import paleta from '../paleta-markdown.json'

// [clave, nombre, color en tema claro, en tema oscuro]
export const ELEMENTOS = paleta.elementos.map((e) => [e.clave, e.nombre, e.claro, e.oscuro])

const CLAVE = 'garabato:colores-markdown'
const ES_COLOR = /^#[0-9a-f]{6}$/i

// Solo claves conocidas y colores válidos; lo demás = predeterminado (null).
// "titulos" (antes un solo color para todos los títulos) pasa a los seis niveles.
export function normalizar(colores) {
  if (colores?.titulos) {
    colores = { ...Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [`titulo${n}`, colores.titulos])), ...colores }
  }
  return {
    ...Object.fromEntries(ELEMENTOS.map(([clave]) => [clave, ES_COLOR.test(colores?.[clave]) ? colores[clave].toLowerCase() : null])),
    grises: colores?.grises === true,
  }
}

// Cuántos colores eligió el usuario (sin contar la opción de grises).
export const contarElegidos = (colores) => ELEMENTOS.filter(([clave]) => ES_COLOR.test(colores?.[clave] ?? '')).length
export const hayElegidos = (colores) => contarElegidos(colores) > 0 || colores?.grises === true

// El gris con la misma luminosidad (Rec. 709) que el color.
export function aGris(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const l = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)
  return `#${l.toString(16).padStart(2, '0').repeat(3)}`
}

// Copia local (para no esperar al servidor al abrir la app).
export function leerColores() {
  try {
    return normalizar(JSON.parse(localStorage.getItem(CLAVE)))
  } catch {
    return normalizar({})
  }
}

export function aplicarColores(colores) {
  const grises = colores?.grises === true
  const raiz = document.documentElement.style
  for (const [clave] of ELEMENTOS) {
    if (colores?.[clave]) raiz.setProperty(`--md-${clave}`, grises ? aGris(colores[clave]) : colores[clave])
    else raiz.removeProperty(`--md-${clave}`)
  }
  // La clase cambia la paleta predeterminada a su versión en grises (aplicarPaleta).
  document.documentElement.classList.toggle('md-grises', grises)
}

// Aplica y deja la copia local (lo que viene de la cuenta o lo que se acaba de elegir).
export function usarColores(colores) {
  const normales = normalizar(colores)
  aplicarColores(normales)
  try {
    localStorage.setItem(CLAVE, JSON.stringify(normales))
  } catch {
    // Sin localStorage: siguen en la cuenta.
  }
  return normales
}

// Variables --md-*-base de la paleta, en una etiqueta <style>.
function aplicarPaleta() {
  const variables = (tema, gris = (c) => c) => ELEMENTOS.map(([clave, , claro, oscuro]) => `--md-${clave}-base: ${gris(tema === 'claro' ? claro : oscuro)};`).join(' ')
  const estilo = document.createElement('style')
  estilo.id = 'paleta-markdown'
  estilo.textContent = [
    `:root { ${variables('claro')} }`,
    `.dark { ${variables('oscuro')} }`,
    `:root.md-grises { ${variables('claro', aGris)} }`,
    `:root.dark.md-grises { ${variables('oscuro', aGris)} }`,
  ].join('\n')
  document.head.append(estilo)
}

// Al abrir la app: la paleta y la copia local; si se cambian en otra pestaña, también.
export function iniciarColores() {
  aplicarPaleta()
  aplicarColores(leerColores())
  window.addEventListener('storage', (e) => {
    if (e.key === CLAVE) aplicarColores(leerColores())
  })
}

// Reglas CSS para el documento impreso (Paged.js): los colores elegidos o los de
// la paleta clara. Solo el contenido (.doc-cuerpo): la portada y las referencias
// quedan en negro. Los símbolos de Markdown no aparecen en el PDF.
export function cssColores(colores) {
  const elegidos = normalizar(colores)
  const color = (c) => (elegidos.grises ? aGris(c) : c)
  const c = Object.fromEntries(ELEMENTOS.map(([clave, , claro]) => [clave, color(elegidos[clave] || claro)]))
  return `
${[1, 2, 3, 4, 5, 6].map((n) => `.doc-cuerpo h${n} { color: ${c[`titulo${n}`]}; }`).join('\n')}
.doc-cuerpo strong { color: ${c.negrita}; }
.doc-cuerpo em { color: ${c.cursiva}; }
.doc-cuerpo del { color: ${c.tachado}; }
.doc-cuerpo a { color: ${c.enlaces}; }
.doc-cuerpo code { color: ${c.codigo}; }
.doc-cuerpo blockquote { border-left-color: ${c.citas}; }
.doc-cuerpo li::marker { color: ${c.listas}; }
`
}
