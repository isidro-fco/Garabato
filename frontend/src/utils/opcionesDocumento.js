// Opciones de formato de un documento (columna `opciones` en la base).

export const OPCIONES_BASE = {
  portada: {
    activa: false,
    titulo: '', // vacío = título del documento
    institucion: '',
    materia: '',
    maestro: '',
    alumno: '',
    matricula: '',
    fecha: '',
    logo: null, // imagen como data URL
  },
  encabezado: { activo: false, texto: '' }, // texto vacío = título del documento
  pie: { activo: false, texto: '' },
  numeracion: {
    activa: true,
    posicion: 'pie-derecha', // pie-derecha | pie-centro | encabezado-derecha
    estilo: 'arabigo', // arabigo | romano | pagina
    contarPortada: false, // false: la primera página después de la portada es la 1
  },
  formato: { tamano: 'carta', fuente: 'serif', interlineado: 1.5 },
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
  carta: { nombre: 'Carta', css: 'letter', altoCm: 27.94 },
  a4: { nombre: 'A4', css: 'A4', altoCm: 29.7 },
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

// --- Datos del alumno que se repiten en todos sus documentos ---
const CLAVE_ALUMNO = 'garabato:datos-alumno'

export function leerDatosAlumno() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_ALUMNO)) ?? {}
  } catch {
    return {}
  }
}

export function recordarDatosAlumno(portada) {
  const { matricula, institucion, logo } = portada
  try {
    localStorage.setItem(CLAVE_ALUMNO, JSON.stringify({ matricula, institucion, logo }))
  } catch {
    // localStorage lleno o bloqueado: solo se pierde la comodidad.
  }
}

const formatoFechaLarga = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
export const fechaDeHoy = () => formatoFechaLarga.format(new Date())
