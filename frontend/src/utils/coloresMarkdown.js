// Colores de los elementos de Markdown en el editor (vista en vivo).
// - La paleta predeterminada está en paleta-markdown.json (un color para tema
//   claro y otro para oscuro) y se aplica como variables --md-*-base.
// - Los colores que elige el usuario se guardan en su cuenta (columna JSONB
//   usuarios.colores, PUT /api/yo/colores) como { clave: "#rrggbb" } y se
//   aplican como --md-*. localStorage guarda una copia para pintarlos antes de
//   que responda el servidor.
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
  return Object.fromEntries(ELEMENTOS.map(([clave]) => [clave, ES_COLOR.test(colores?.[clave]) ? colores[clave].toLowerCase() : null]))
}

export const hayElegidos = (colores) => Object.values(colores ?? {}).some(Boolean)

// Copia local (para no esperar al servidor al abrir la app).
export function leerColores() {
  try {
    return normalizar(JSON.parse(localStorage.getItem(CLAVE)))
  } catch {
    return normalizar({})
  }
}

export function aplicarColores(colores) {
  const raiz = document.documentElement.style
  for (const [clave] of ELEMENTOS) {
    if (colores?.[clave]) raiz.setProperty(`--md-${clave}`, colores[clave])
    else raiz.removeProperty(`--md-${clave}`)
  }
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
  const variables = (tema) => ELEMENTOS.map(([clave, , claro, oscuro]) => `--md-${clave}-base: ${tema === 'claro' ? claro : oscuro};`).join(' ')
  const estilo = document.createElement('style')
  estilo.id = 'paleta-markdown'
  estilo.textContent = `:root { ${variables('claro')} }\n.dark { ${variables('oscuro')} }`
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
  const c = Object.fromEntries(ELEMENTOS.map(([clave, , claro]) => [clave, elegidos[clave] || claro]))
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
