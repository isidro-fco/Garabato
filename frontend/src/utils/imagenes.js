// Logos de la portada: se reducen para que no pesen en la base y se guardan
// como data URL. Las imágenes con transparencia (PNG o WebP sin fondo) la
// conservan; las que no tienen transparencia se guardan en JPEG, que pesa menos.

const LADO_MAXIMO = 600

function cargar(src) {
  return new Promise((resolve, reject) => {
    const imagen = new Image()
    imagen.onload = () => resolve(imagen)
    imagen.onerror = () => reject(new Error('No se pudo leer la imagen'))
    imagen.src = src
  })
}

function aLienzo(imagen) {
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.naturalWidth, imagen.naturalHeight))
  const lienzo = document.createElement('canvas')
  lienzo.width = Math.max(1, Math.round(imagen.naturalWidth * escala))
  lienzo.height = Math.max(1, Math.round(imagen.naturalHeight * escala))
  lienzo.getContext('2d', { willReadFrequently: true }).drawImage(imagen, 0, 0, lienzo.width, lienzo.height)
  return lienzo
}

function tieneTransparencia(datos) {
  for (let i = 3; i < datos.length; i += 4) if (datos[i] < 250) return true
  return false
}

// Con transparencia: WebP (si el navegador no sabe crearlo, devuelve PNG).
// Sin transparencia: JPEG.
function exportar(lienzo) {
  const { data } = lienzo.getContext('2d').getImageData(0, 0, lienzo.width, lienzo.height)
  if (!tieneTransparencia(data)) return lienzo.toDataURL('image/jpeg', 0.9)
  const webp = lienzo.toDataURL('image/webp', 0.92)
  return webp.startsWith('data:image/webp') ? webp : lienzo.toDataURL('image/png')
}

export async function leerLogo(archivo) {
  if (!archivo.type.startsWith('image/')) throw new Error('El archivo no es una imagen')
  const url = URL.createObjectURL(archivo)
  try {
    return exportar(aLienzo(await cargar(url)))
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function esTransparente(dataUrl) {
  const lienzo = aLienzo(await cargar(dataUrl))
  return tieneTransparencia(lienzo.getContext('2d').getImageData(0, 0, lienzo.width, lienzo.height).data)
}

// Quita un fondo de color liso (por ejemplo, el blanco de un JPG): toma el
// color de las esquinas y vuelve transparentes los píxeles parecidos que están
// conectados con el borde (así no borra el blanco que está dentro del logo).
// Devuelve null si las esquinas no comparten un color de fondo.
export async function quitarFondo(dataUrl, tolerancia = 42) {
  const lienzo = aLienzo(await cargar(dataUrl))
  const { width: an, height: al } = lienzo
  const ctx = lienzo.getContext('2d')
  const imagen = ctx.getImageData(0, 0, an, al)
  const d = imagen.data
  const color = (p) => [d[p * 4], d[p * 4 + 1], d[p * 4 + 2], d[p * 4 + 3]]
  const distancia = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

  // Color de fondo: el promedio de las esquinas opacas, si se parecen entre sí.
  const esquinas = [0, an - 1, (al - 1) * an, al * an - 1].map(color).filter((c) => c[3] > 200)
  if (esquinas.length < 3) return null
  const fondo = [0, 1, 2].map((i) => esquinas.reduce((s, c) => s + c[i], 0) / esquinas.length)
  if (esquinas.some((c) => distancia(c, fondo) > tolerancia)) return null

  // Relleno desde el borde.
  const visto = new Uint8Array(an * al)
  const pendientes = []
  for (let x = 0; x < an; x++) pendientes.push(x, (al - 1) * an + x)
  for (let y = 0; y < al; y++) pendientes.push(y * an, y * an + an - 1)
  let quitados = 0
  while (pendientes.length) {
    const p = pendientes.pop()
    if (visto[p]) continue
    visto[p] = 1
    const c = color(p)
    const dist = distancia(c, fondo)
    if (c[3] < 10 || dist > tolerancia) continue
    // Borde suave: los píxeles casi iguales al fondo desaparecen del todo y
    // los del límite quedan semitransparentes.
    d[p * 4 + 3] = Math.round(c[3] * Math.min(1, Math.max(0, (dist - tolerancia / 2) / (tolerancia / 2))))
    quitados++
    const x = p % an
    if (x > 0) pendientes.push(p - 1)
    if (x < an - 1) pendientes.push(p + 1)
    if (p >= an) pendientes.push(p - an)
    if (p < (al - 1) * an) pendientes.push(p + an)
  }
  if (quitados === 0) return null
  ctx.putImageData(imagen, 0, 0)
  return exportar(lienzo)
}
