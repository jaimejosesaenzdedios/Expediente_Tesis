import type { Firma } from '../domain/types'

const TIPOS_PERMITIDOS = ['image/png', 'image/jpeg', 'image/webp']
const BYTES_MAXIMOS = 5 * 1024 * 1024
const ANCHO_MAXIMO = 900
const ANCHO_MINIMO = 120
const ALTO_MINIMO = 40

export class ErrorFirma extends Error {}

function leerArchivo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => resolve(String(lector.result))
    lector.onerror = () => reject(new ErrorFirma('No se pudo leer el archivo seleccionado'))
    lector.readAsDataURL(file)
  })
}

function cargarImagen(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagen = new Image()
    imagen.onload = () => resolve(imagen)
    imagen.onerror = () => reject(new ErrorFirma('El archivo no es una imagen válida'))
    imagen.src = dataUrl
  })
}

export async function procesarFirma(file: File): Promise<Firma> {
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    throw new ErrorFirma('La firma debe ser una imagen PNG, JPG o WEBP')
  }
  if (file.size > BYTES_MAXIMOS) {
    throw new ErrorFirma('La imagen supera el límite de 5 MB')
  }

  const dataUrlOriginal = await leerArchivo(file)
  const imagen = await cargarImagen(dataUrlOriginal)

  if (imagen.naturalWidth < ANCHO_MINIMO || imagen.naturalHeight < ALTO_MINIMO) {
    throw new ErrorFirma('La imagen es demasiado pequeña, recórtala alrededor de la firma')
  }

  const escala = Math.min(1, ANCHO_MAXIMO / imagen.naturalWidth)
  const ancho = Math.round(imagen.naturalWidth * escala)
  const alto = Math.round(imagen.naturalHeight * escala)

  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  const contexto = lienzo.getContext('2d')
  if (!contexto) throw new ErrorFirma('No se pudo procesar la imagen')
  contexto.fillStyle = '#ffffff'
  contexto.fillRect(0, 0, ancho, alto)
  contexto.drawImage(imagen, 0, 0, ancho, alto)

  const dataUrl = lienzo.toDataURL('image/jpeg', 0.85)

  return {
    nombreArchivo: file.name,
    tipoMime: file.type,
    bytes: file.size,
    anchoPx: ancho,
    altoPx: alto,
    dataUrl,
  }
}