// Formateador APA 7 (adaptación al español: "y" entre autores, "s.f.", "ed.").
// Las referencias se generan en Markdown: las cursivas con *…* y los enlaces
// como <https://…>, para que la vista previa y el PDF las dibujen igual.

export const TIPOS_FUENTE = {
  libro: 'Libro',
  articulo: 'Artículo de revista',
  web: 'Página web',
}

export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export function fuenteVacia(tipo = 'libro') {
  return {
    id: crypto.randomUUID(),
    tipo,
    autores: [{ apellidos: '', nombres: '' }],
    anio: '',
    mes: '', // solo páginas web: 1–12
    dia: '',
    titulo: '',
    edicion: '', // libro
    editorial: '',
    revista: '', // artículo
    volumen: '',
    numero: '',
    paginas: '',
    sitio: '', // página web
    enlace: '', // DOI o URL
  }
}

const limpio = (texto) => (texto ?? '').trim().replace(/\s+/g, ' ')

// Que el texto no active Markdown por accidente (un título con * o _).
const escapar = (texto) => texto.replace(/([\\`*_[\]<>#|~])/g, '\\$1')

// Agrega punto final salvo que ya termine en signo de puntuación.
const conPunto = (texto) => (/[.?!]$/.test(texto) ? texto : `${texto}.`)

const cursiva = (texto) => `*${escapar(texto)}*`

// Autores con algún dato; sin nombres se trata como organización (UNESCO, INEGI…).
const autoresValidos = (fuente) =>
  (fuente.autores ?? [])
    .map((a) => ({ apellidos: limpio(a.apellidos), nombres: limpio(a.nombres) }))
    .filter((a) => a.apellidos)

// "Gabriel José" → "G. J."; "Jean-Paul" → "J.-P."
export function iniciales(nombres) {
  return limpio(nombres)
    .split(' ')
    .filter(Boolean)
    .map((nombre) => nombre.split('-').map((parte) => `${parte[0].toLocaleUpperCase('es')}.`).join('-'))
    .join(' ')
}

const autorReferencia = ({ apellidos, nombres }) => (nombres ? `${apellidos}, ${iniciales(nombres)}` : apellidos)

// Lista de autores de la referencia: 1, 2 ("y"), de 3 a 20 (comas y "y"),
// 21 o más (los primeros 19, ". . ." y el último).
export function listaAutores(autores) {
  const nombres = autores.map(autorReferencia)
  if (nombres.length <= 1) return nombres[0] ?? ''
  if (nombres.length > 20) return `${nombres.slice(0, 19).join(', ')}, . . . ${nombres.at(-1)}`
  return `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`
}

// DOI → https://doi.org/…; un dominio sin protocolo → https://…
export function normalizarEnlace(enlace) {
  const texto = limpio(enlace).replace(/\s/g, '')
  if (!texto) return ''
  const doi = texto.match(/^(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:)?(10\.\d{4,9}\/\S+)$/i)
  if (doi) return `https://doi.org/${doi[1]}`
  if (/^https?:\/\//i.test(texto)) return texto
  return `https://${texto}`
}

const edicion = (texto) => {
  const valor = limpio(texto)
  if (!valor || valor === '1') return ''
  return /^\d+$/.test(valor) ? `${valor}.ª ed.` : valor
}

const paginas = (texto) => limpio(texto).replace(/\s*[-–—]\s*/g, '–')

// Letra para distinguir obras del mismo autor y año: 2020a, 2020b…
// Devuelve un Map id → letra ('' si no hace falta).
export function letrasPorAnio(fuentes) {
  const grupos = new Map()
  for (const f of fuentes) {
    const clave = `${listaAutores(autoresValidos(f)).toLocaleLowerCase('es')}|${limpio(f.anio)}`
    if (!autoresValidos(f).length) continue
    grupos.set(clave, [...(grupos.get(clave) ?? []), f])
  }
  const letras = new Map(fuentes.map((f) => [f.id, '']))
  for (const grupo of grupos.values()) {
    if (grupo.length < 2) continue
    grupo
      .sort((a, b) => limpio(a.titulo).localeCompare(limpio(b.titulo), 'es', { sensitivity: 'base' }))
      .forEach((f, i) => letras.set(f.id, String.fromCharCode(97 + i)))
  }
  return letras
}

const anio = (fuente, letra = '') => (limpio(fuente.anio) ? `${limpio(fuente.anio)}${letra}` : `s.f.${letra ? `-${letra}` : ''}`)

function fechaReferencia(fuente, letra) {
  const base = anio(fuente, letra)
  if (fuente.tipo !== 'web' || !limpio(fuente.anio) || !fuente.mes) return base
  const mes = MESES[Number(fuente.mes) - 1]
  return limpio(fuente.dia) ? `${base}, ${limpio(fuente.dia)} de ${mes}` : `${base}, ${mes}`
}

// La referencia completa en Markdown.
export function referenciaApa(fuente, letra = '') {
  const autores = autoresValidos(fuente)
  const titulo = limpio(fuente.titulo) || 'Sin título'
  const fecha = `(${fechaReferencia(fuente, letra)}).`
  const enlace = normalizarEnlace(fuente.enlace)
  const partes = []

  // Título del trabajo: en cursivas salvo el de un artículo.
  const ed = fuente.tipo === 'libro' ? edicion(fuente.edicion) : ''
  const tituloObra = fuente.tipo === 'articulo'
    ? conPunto(escapar(titulo))
    : `${cursiva(titulo)}${ed ? ` (${escapar(ed)})` : ''}${/[.?!]$/.test(titulo) && !ed ? '' : '.'}`

  if (autores.length) {
    partes.push(conPunto(escapar(listaAutores(autores))), fecha, tituloObra)
  } else {
    // Sin autor, el título ocupa su lugar.
    partes.push(tituloObra, fecha)
  }

  if (fuente.tipo === 'libro' && limpio(fuente.editorial)) {
    partes.push(conPunto(escapar(limpio(fuente.editorial))))
  }
  if (fuente.tipo === 'articulo' && limpio(fuente.revista)) {
    let revista = cursiva(limpio(fuente.revista))
    if (limpio(fuente.volumen)) revista += `, *${escapar(limpio(fuente.volumen))}*`
    if (limpio(fuente.numero)) revista += `(${escapar(limpio(fuente.numero))})`
    if (limpio(fuente.paginas)) revista += `, ${escapar(paginas(fuente.paginas))}`
    partes.push(`${revista}.`)
  }
  if (fuente.tipo === 'web' && limpio(fuente.sitio)) {
    // Si el sitio es el mismo autor (organización), no se repite.
    const sitio = limpio(fuente.sitio)
    const repetido = autores.length === 1 && !autores[0].nombres && autores[0].apellidos.toLocaleLowerCase('es') === sitio.toLocaleLowerCase('es')
    if (!repetido) partes.push(conPunto(escapar(sitio)))
  }
  if (enlace) partes.push(`<${enlace}>`)

  return partes.join(' ')
}

// Título abreviado para citar una obra sin autor (primeras cuatro palabras).
function tituloCorto(fuente) {
  const palabras = (limpio(fuente.titulo) || 'Sin título').split(' ')
  const corto = palabras.length > 4 ? `${palabras.slice(0, 4).join(' ')}…` : palabras.join(' ')
  return fuente.tipo === 'articulo' ? `“${escapar(corto)}”` : cursiva(corto)
}

function autorCita(fuente) {
  const autores = autoresValidos(fuente)
  if (autores.length === 0) return tituloCorto(fuente)
  const apellido = (a) => escapar(a.apellidos)
  if (autores.length === 1) return apellido(autores[0])
  if (autores.length === 2) return `${apellido(autores[0])} y ${apellido(autores[1])}`
  return `${apellido(autores[0])} et al.`
}

// "15" → "p. 15"; "15-17" → "pp. 15–17"
function pagina(texto) {
  const valor = paginas(texto)
  if (!valor) return ''
  return /[–,]/.test(valor) ? `pp. ${valor}` : `p. ${valor}`
}

// Cita en el texto. narrativa: "García (2020)"; si no, "(García, 2020)".
export function citaApa(fuente, { narrativa = false, pagina: pag = '', letra = '' } = {}) {
  const autor = autorCita(fuente)
  const fecha = [anio(fuente, letra), pagina(pag)].filter(Boolean).join(', ')
  return narrativa ? `${autor} (${fecha})` : `(${autor}, ${fecha})`
}

// Orden de la lista de referencias: primer autor (o título), luego el año
// (las obras sin fecha primero) y el título.
const comparar = (a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })
export function ordenarFuentes(fuentes) {
  const clave = (f) => {
    const autores = autoresValidos(f)
    return autores.length ? listaAutores(autores) : limpio(f.titulo)
  }
  return [...fuentes].sort((a, b) =>
    comparar(clave(a), clave(b))
    || (limpio(a.anio) ? 1 : 0) - (limpio(b.anio) ? 1 : 0)
    || comparar(limpio(a.anio), limpio(b.anio))
    || comparar(limpio(a.titulo), limpio(b.titulo)))
}

// Las referencias ya ordenadas y con su letra, listas para dibujar.
export function listaReferencias(fuentes = []) {
  const letras = letrasPorAnio(fuentes)
  return ordenarFuentes(fuentes).map((f) => ({ id: f.id, markdown: referenciaApa(f, letras.get(f.id)) }))
}
