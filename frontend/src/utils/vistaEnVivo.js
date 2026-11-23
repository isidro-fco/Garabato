// "Vista en vivo" para CodeMirror: el Markdown se ve ya formateado (títulos,
// negritas, listas, tablas…) y solo la línea donde está el cursor muestra sus
// marcas (#, **, [](), etc.) para poder editarlas. Los estilos están en index.css
// (clases cm-vv-*).
import { syntaxTree } from '@codemirror/language'
import { StateField } from '@codemirror/state'
import { Decoration, EditorView, ViewPlugin, WidgetType } from '@codemirror/view'

const ocultar = Decoration.replace({})
const marca = Decoration.mark({ class: 'cm-vv-marca' })
const estilo = (clase) => Decoration.mark({ class: clase })
const linea = (clase) => Decoration.line({ class: clase })

const ESTILOS = {
  StrongEmphasis: estilo('cm-vv-negrita'),
  Emphasis: estilo('cm-vv-cursiva'),
  Strikethrough: estilo('cm-vv-tachado'),
  InlineCode: estilo('cm-vv-codigo'),
}
// Marcas que desaparecen fuera de la línea activa.
const MARCAS = new Set(['EmphasisMark', 'StrikethroughMark', 'QuoteMark'])

// --- Widgets: lo que se dibuja en lugar del Markdown ---

class Vineta extends WidgetType {
  eq() { return true }
  toDOM() {
    const span = document.createElement('span')
    span.className = 'cm-vv-vineta'
    span.textContent = '•'
    return span
  }
}

class Casilla extends WidgetType {
  constructor(marcada) { super(); this.marcada = marcada }
  eq(otro) { return otro.marcada === this.marcada }
  toDOM() {
    const span = document.createElement('span')
    span.className = 'cm-vv-casilla'
    span.dataset.marcada = this.marcada
    span.setAttribute('aria-hidden', 'true')
    return span
  }
}

class Linea extends WidgetType {
  eq() { return true }
  toDOM() {
    const span = document.createElement('span')
    span.className = 'cm-vv-linea'
    return span
  }
}

class Imagen extends WidgetType {
  constructor(url, alt) { super(); this.url = url; this.alt = alt }
  eq(otro) { return otro.url === this.url && otro.alt === this.alt }
  toDOM() {
    const img = document.createElement('img')
    img.className = 'cm-vv-imagen'
    img.src = this.url
    img.alt = this.alt
    return img
  }
  ignoreEvent() { return false } // clic = poner el cursor ahí y ver el Markdown
}

// Quita el Markdown en línea de una celda (la tabla se dibuja como texto).
const textoPlano = (texto) => texto.replace(/(\*\*|__|\*|_|~~|`)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')

class Tabla extends WidgetType {
  constructor(filas) { super(); this.filas = filas } // [[celda, …], …]; la primera es el encabezado
  eq(otra) { return JSON.stringify(otra.filas) === JSON.stringify(this.filas) }
  toDOM() {
    const tabla = document.createElement('table')
    tabla.className = 'cm-vv-tabla'
    this.filas.forEach((celdas, i) => {
      const tr = tabla.insertRow()
      for (const celda of celdas) {
        const td = document.createElement(i === 0 ? 'th' : 'td')
        td.textContent = textoPlano(celda)
        tr.append(td)
      }
    })
    const envoltura = document.createElement('div')
    envoltura.className = 'cm-vv-tabla-envoltura'
    envoltura.append(tabla)
    return envoltura
  }
  ignoreEvent() { return false }
}

// --- Líneas activas ---

// Números de línea que tocan la selección. Sin foco no hay ninguna: todo se ve formateado.
function lineasActivas(state, conFoco) {
  const activas = new Set()
  if (!conFoco) return activas
  for (const r of state.selection.ranges) {
    const desde = state.doc.lineAt(r.from).number
    const hasta = state.doc.lineAt(r.to).number
    for (let n = desde; n <= hasta; n++) activas.add(n)
  }
  return activas
}

// --- Decoraciones en línea (plugin de vista) ---

function decorar(view) {
  const { state } = view
  const activas = lineasActivas(state, view.hasFocus)
  const activa = (pos) => activas.has(state.doc.lineAt(pos).number)
  const rangos = []
  const agregar = (deco, desde, hasta = desde) => rangos.push(deco.range(desde, hasta))
  // Oculta la marca y el espacio que la sigue ("# ", "> ").
  const ocultarConEspacio = (n) => {
    const fin = state.doc.sliceString(n.to, n.to + 1) === ' ' ? n.to + 1 : n.to
    agregar(ocultar, n.from, fin)
  }

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter: (n) => {
        const nombre = n.name
        const enActiva = activa(n.from)

        const titulo = /^ATXHeading(\d)$/.exec(nombre)
        if (titulo) {
          agregar(linea(`cm-vv-titulo cm-vv-h${titulo[1]}`), state.doc.lineAt(n.from).from)
          return
        }
        if (nombre === 'HeaderMark') {
          if (enActiva) agregar(marca, n.from, n.to)
          else ocultarConEspacio(n)
          return
        }
        if (ESTILOS[nombre]) {
          agregar(ESTILOS[nombre], n.from, n.to)
          if (nombre === 'InlineCode') {
            // Las comillas invertidas del código en línea.
            for (let hijo = n.node.firstChild; hijo; hijo = hijo.nextSibling) {
              if (hijo.name === 'CodeMark') agregar(enActiva ? marca : ocultar, hijo.from, hijo.to)
            }
            return false
          }
          return
        }
        if (MARCAS.has(nombre)) {
          if (enActiva) agregar(marca, n.from, n.to)
          else if (nombre === 'QuoteMark') ocultarConEspacio(n)
          else agregar(ocultar, n.from, n.to)
          return
        }
        if (nombre === 'Blockquote') {
          for (let pos = n.from; pos <= n.to;) {
            const l = state.doc.lineAt(pos)
            agregar(linea('cm-vv-cita'), l.from)
            pos = l.to + 1
          }
          return
        }
        if (nombre === 'Link' || nombre === 'Autolink') {
          const hijos = []
          for (let hijo = n.node.firstChild; hijo; hijo = hijo.nextSibling) hijos.push(hijo)
          const marcas = hijos.filter((h) => h.name === 'LinkMark')
          const url = hijos.find((h) => h.name === 'URL')
          if (nombre === 'Autolink') {
            if (url) agregar(estilo('cm-vv-enlace'), url.from, url.to)
            for (const m of marcas) agregar(enActiva ? marca : ocultar, m.from, m.to)
            return false
          }
          // [texto](url): se ve solo el texto, con estilo de enlace.
          const [abre, cierra] = marcas
          if (abre && cierra) agregar(estilo('cm-vv-enlace'), abre.to, cierra.from)
          if (enActiva) {
            for (const m of marcas) agregar(marca, m.from, m.to)
            if (url) agregar(estilo('cm-vv-marca cm-vv-url'), url.from, url.to)
          } else if (abre && cierra) {
            agregar(ocultar, abre.from, abre.to)
            agregar(ocultar, cierra.from, n.to)
          }
          return // el texto del enlace puede tener negritas, etc.
        }
        if (nombre === 'URL') {
          agregar(estilo('cm-vv-enlace'), n.from, n.to) // enlace suelto (GFM)
          return
        }
        if (nombre === 'Image') {
          if (enActiva) return
          const texto = state.doc.sliceString(n.from, n.to)
          const partes = /^!\[([^\]]*)\]\(\s*(\S+?)(?:\s+"[^"]*")?\s*\)$/.exec(texto)
          if (partes) agregar(Decoration.replace({ widget: new Imagen(partes[2], partes[1]) }), n.from, n.to)
          return false
        }
        if (nombre === 'ListMark') {
          const lista = n.node.parent?.parent?.name
          if (enActiva) agregar(marca, n.from, n.to)
          else if (lista === 'BulletList') agregar(Decoration.replace({ widget: new Vineta() }), n.from, n.to)
          else agregar(estilo('cm-vv-numero'), n.from, n.to)
          return
        }
        if (nombre === 'TaskMarker') {
          if (enActiva) agregar(marca, n.from, n.to)
          else agregar(Decoration.replace({ widget: new Casilla(/x/i.test(state.doc.sliceString(n.from, n.to))) }), n.from, n.to)
          return
        }
        if (nombre === 'HorizontalRule') {
          if (enActiva) agregar(marca, n.from, n.to)
          else agregar(Decoration.replace({ widget: new Linea() }), n.from, n.to)
          return
        }
        if (nombre === 'FencedCode') {
          for (let pos = n.from; pos <= n.to;) {
            const l = state.doc.lineAt(pos)
            const cerca = l.from === n.from || l.to === n.to // las líneas ```
            agregar(linea(cerca && !activas.has(l.number) ? 'cm-vv-bloque cm-vv-cerca' : 'cm-vv-bloque'), l.from)
            pos = l.to + 1
          }
          return false
        }
        if (nombre === 'Table') {
          // Fuera de la línea activa, el campo `tablas` la dibuja; aquí solo el Markdown crudo.
          for (let pos = n.from; pos <= n.to;) {
            const l = state.doc.lineAt(pos)
            agregar(linea('cm-vv-tabla-cruda'), l.from)
            pos = l.to + 1
          }
          return false
        }
      },
    })
  }
  return Decoration.set(rangos, true)
}

const enLinea = ViewPlugin.fromClass(
  class {
    constructor(view) { this.decorations = decorar(view) }
    update(u) {
      if (u.docChanged || u.selectionSet || u.viewportChanged || u.focusChanged || syntaxTree(u.startState) !== syntaxTree(u.state)) {
        this.decorations = decorar(u.view)
      }
    }
  },
  { decorations: (v) => v.decorations },
)

// --- Tablas (decoración de bloque: tiene que venir de un StateField) ---

function decorarTablas(state) {
  const activas = lineasActivas(state, true)
  const rangos = []
  syntaxTree(state).iterate({
    enter: (n) => {
      if (n.name !== 'Table') return
      const desde = state.doc.lineAt(n.from).number
      const hasta = state.doc.lineAt(n.to).number
      for (let i = desde; i <= hasta; i++) if (activas.has(i)) return false
      const filas = []
      for (let fila = n.node.firstChild; fila; fila = fila.nextSibling) {
        if (fila.name !== 'TableHeader' && fila.name !== 'TableRow') continue
        const celdas = []
        for (let c = fila.firstChild; c; c = c.nextSibling) if (c.name === 'TableCell') celdas.push(state.doc.sliceString(c.from, c.to).trim())
        filas.push(celdas)
      }
      rangos.push(Decoration.replace({ widget: new Tabla(filas), block: true }).range(state.doc.lineAt(n.from).from, state.doc.lineAt(n.to).to))
      return false
    },
  })
  return Decoration.set(rangos, true)
}

const tablas = StateField.define({
  create: decorarTablas,
  update: (deco, tr) =>
    tr.docChanged || tr.selection || syntaxTree(tr.startState) !== syntaxTree(tr.state) ? decorarTablas(tr.state) : deco,
  provide: (campo) => EditorView.decorations.from(campo),
})

export const vistaEnVivo = [enLinea, tablas]
