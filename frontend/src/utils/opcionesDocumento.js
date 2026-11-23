// Opciones de formato de un documento (columna `opciones` en la base).

export const OPCIONES_BASE = {
  portada: {
    activa: false,
    titulo: '', // vacío = título del documento
    institucion: '',
    facultad: '',
    carrera: '',
    materia: '',
    maestro: '',
    tituloMaestro: 'Profesor', // etiqueta del maestro en la portada (ver TITULOS_MAESTRO)
    alumno: '',
    matricula: '',
    companeros: [], // más estudiantes del equipo: [{ nombre, matricula }]
    grupo: '',
    lugar: '', // ciudad y estado, antes de la fecha
    fecha: '',
    logo: null, // imagen como data URL
    logo2: null, // segundo logo: con dos, cada uno va en una esquina
  },
  encabezado: { activo: false, texto: '' }, // texto vacío = título del documento
  pie: { activo: false, texto: '' },
  numeracion: {
    activa: true,
    posicion: 'pie-derecha', // pie-derecha | pie-centro | encabezado-derecha
    estilo: 'arabigo', // arabigo | romano | pagina
    contarPortada: false, // false: la primera página después de la portada es la 1
  },
  // colores: el PDF usa los colores del editor (títulos, negritas, enlaces…); false = todo en negro.
  formato: { tamano: 'carta', fuente: 'serif', interlineado: 1.5, colores: true },
  // Fuentes en APA (ver utils/apa.js); la sección "Referencias" se genera al final.
  referencias: { nuevaPagina: true, fuentes: [] },
}

// Completa con los valores por defecto lo que falte (documentos viejos o vacíos).
export function completarOpciones(opciones = {}) {
  const completas = {}
  for (const [seccion, base] of Object.entries(OPCIONES_BASE)) {
    completas[seccion] = { ...base, ...opciones?.[seccion] }
  }
  return completas
}

export const TAMANOS = {
  carta: { nombre: 'Carta', css: 'letter', anchoCm: 21.59, altoCm: 27.94 },
  a4: { nombre: 'A4', css: 'A4', anchoCm: 21, altoCm: 29.7 },
}

export const FUENTES = {
  serif: { nombre: 'Times New Roman', css: "'Times New Roman', Times, 'Liberation Serif', serif" },
  sans: { nombre: 'Arial', css: "Arial, Helvetica, 'Liberation Sans', sans-serif" },
}

export const MARGEN_CM = 2.5

// Variables CSS que usa .documento (documento.css).
export function variablesDocumento(opciones) {
  const { formato } = opciones
  return {
    '--doc-fuente': (FUENTES[formato.fuente] ?? FUENTES.serif).css,
    '--doc-interlineado': formato.interlineado,
    // Alto útil de la página, para centrar la portada.
    '--doc-alto-util': `${(TAMANOS[formato.tamano] ?? TAMANOS.carta).altoCm - 2 * MARGEN_CM - 0.3}cm`,
  }
}

// Medidas de las hojas del editor en píxeles de pantalla. La hoja se reduce
// (escala) cuando no cabe. La letra del texto también, pero no baja de 12 px
// (15 px en celular) para poder leerla; si ya no está a escala, el texto ocupa
// más que en papel y no se marcan los cortes de página porque no coincidirían.
const PX_POR_CM = 96 / 2.54
export function medidasHoja(formato, anchoDisponible) {
  const tamano = TAMANOS[formato?.tamano] ?? TAMANOS.carta
  const anchoReal = tamano.anchoCm * PX_POR_CM
  const escala = anchoDisponible > 0 ? Math.min(1, anchoDisponible / anchoReal) : 1
  const alto = tamano.altoCm * PX_POR_CM * escala
  const margen = MARGEN_CM * PX_POR_CM * escala
  const letraEscala = 16 * escala // 12 pt = 16 px
  const letra = Math.max(anchoDisponible < 600 ? 15 : 12, letraEscala)
  return {
    tamano,
    escala,
    alto,
    margen,
    aEscala: letraEscala >= letra * 0.95,
    estilo: {
      '--hoja-ancho': `${anchoReal * escala}px`,
      '--hoja-alto': `${alto}px`,
      '--hoja-margen': `${margen}px`,
      '--hoja-letra': `${letra}px`,
      '--doc-fuente': (FUENTES[formato?.fuente] ?? FUENTES.serif).css,
      '--doc-interlineado': formato?.interlineado ?? 1.5,
    },
  }
}

// --- Datos del alumno que se repiten en todos sus documentos ---
const CLAVE_ALUMNO = 'garabato:datos-alumno'

export function leerDatosAlumno() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_ALUMNO)) ?? {}
  } catch {
    return {}
  }
}

// Campos de la portada que casi no cambian entre documentos.
export const CAMPOS_ALUMNO = ['institucion', 'facultad', 'carrera', 'matricula', 'grupo', 'lugar', 'logo', 'logo2']

export const TITULOS_MAESTRO = ['Profesor', 'Profesora', 'Maestro', 'Maestra', 'Docente']

export function recordarDatosAlumno(portada) {
  try {
    localStorage.setItem(CLAVE_ALUMNO, JSON.stringify(Object.fromEntries(CAMPOS_ALUMNO.map((c) => [c, portada[c]]))))
  } catch {
    // localStorage lleno o bloqueado: solo se pierde la comodidad.
  }
}

const formatoFechaLarga = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
export const fechaDeHoy = () => formatoFechaLarga.format(new Date())
