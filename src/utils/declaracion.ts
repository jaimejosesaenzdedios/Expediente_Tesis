import JSZip from 'jszip'
import type { Expediente } from '../domain/types'

const RUTA_PLANTILLA = '/plantillas/ANEXO 18- DJ Asesor.docx'
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function reemplazar(xml: string, buscar: string, reemplazo: string): string {
  return xml.split(buscar).join(reemplazo)
}

function normalizarClave(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[[\]\s]/g, '')
    .toUpperCase()
}

function extraerRPr(sdt: string): string {
  const contenido = sdt.match(/<w:sdtContent>([\s\S]*?)<\/w:sdtContent>/)
  if (!contenido) return ''
  const rPr = contenido[1].match(/<w:rPr>[\s\S]*?<\/w:rPr>/)
  return rPr ? rPr[0] : ''
}

function reemplazarSDTs(xml: string, valores: Record<string, string>, dibujoFirma: string): string {
  return xml.replace(/<w:sdt>[\s\S]*?<\/w:sdt>/g, (sdt) => {
    const textos = [...sdt.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((coincidencia) => coincidencia[1])
    const clave = normalizarClave(textos.join(''))

    if (clave === 'FIRMA') return dibujoFirma

    const valor = valores[clave]
    if (valor === undefined) return sdt

    return `<w:r>${extraerRPr(sdt)}<w:t xml:space="preserve">${valor}</w:t></w:r>`
  })
}

function dataUrlABytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] ?? ''
  const binario = atob(base64)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return bytes
}

function dibujoFirma(anchoPx: number, altoPx: number, anchoMax = 220): string {
  const escala = Math.min(1, anchoMax / Math.max(1, anchoPx))
  const ancho = Math.max(1, Math.round(anchoPx * escala))
  const alto = Math.max(1, Math.round(altoPx * escala))
  const cx = ancho * 9525
  const cy = alto * 9525
  const idDoc = Math.floor(Math.random() * 900000000) + 100000000
  const idPic = Math.floor(Math.random() * 9000) + 1000
  const anchorId = Math.random().toString(16).slice(2, 10).toUpperCase()
  const editId = Math.random().toString(16).slice(2, 10).toUpperCase()
  return (
    '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" ' +
    `wp14:anchorId="${anchorId}" wp14:editId="${editId}">` +
    `<wp:extent cx="${cx}" cy="${cy}"/>` +
    '<wp:effectExtent l="0" t="0" r="0" b="0"/>' +
    `<wp:docPr id="${idDoc}" name="Firma del asesor"/>` +
    '<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
    '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
    '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
    '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
    `<pic:nvPicPr><pic:cNvPr id="${idPic}" name="firma.jpg"/><pic:cNvPicPr><a:picLocks noChangeAspect="1"/></pic:cNvPicPr></pic:nvPicPr>` +
    '<pic:blipFill><a:blip r:embed="rIdFirmaImg"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>'
  )
}

export function transformarDocumento(xml: string, expediente: Expediente, fecha = new Date()): string {
  const nombreAsesor = escaparXml(`${expediente.asesor.nombres} ${expediente.asesor.apellidos}`.trim())
  const dni = escaparXml(expediente.asesor.dni)
  const estudiantes = expediente.estudiantes.map((estudiante) =>
    escaparXml(`${estudiante.nombres} ${estudiante.apellidos}`.trim()),
  )
  const textoEstudiantes =
    estudiantes.length >= 2 ? `${estudiantes[0]} y ${estudiantes[1]}` : (estudiantes[0] ?? '')

  const valores: Record<string, string> = {
    ASESOR: nombreAsesor,
    DNI_ASESOR: dni,
    CARRERA: escaparXml(expediente.carrera),
    TITUTO_FINAL: escaparXml(expediente.tituloFinal),
    TESISTA1_TESISTA_2: textoEstudiantes,
    TITULO_PROFESIONAL: escaparXml(expediente.tituloProfesional),
  }

  const dibujo = expediente.asesor.firma.dataUrl
    ? dibujoFirma(expediente.asesor.firma.anchoPx, expediente.asesor.firma.altoPx)
    : ''

  xml = reemplazarSDTs(xml, valores, dibujo)

  if (estudiantes.length === 1) {
    xml = reemplazar(xml, 'que ha sido elaborado por los tesistas ', 'que ha sido elaborado por el tesista ')
  }

  xml = reemplazar(xml, '>___</w:t>', `>${String(fecha.getDate()).padStart(2, '0')}</w:t>`)
  xml = xml.replace(/; de _+ /, `; de ${MESES[fecha.getMonth()]} `)
  xml = xml.replace(/ 20_+/, ` ${fecha.getFullYear()}`)

  return xml
}

export async function generarDeclaracion(expediente: Expediente): Promise<Blob> {
  const respuesta = await fetch(RUTA_PLANTILLA)
  if (!respuesta.ok) throw new Error('No se pudo cargar la plantilla de la declaración')

  const zip = await JSZip.loadAsync(await respuesta.arrayBuffer())
  const xml = transformarDocumento(await zip.file('word/document.xml')!.async('string'), expediente)

  zip.file('word/document.xml', xml)

  if (expediente.asesor.firma.dataUrl) {
    zip.file('word/media/firma.jpg', dataUrlABytes(expediente.asesor.firma.dataUrl))

    let rels = await zip.file('word/_rels/document.xml.rels')!.async('string')
    rels = reemplazar(
      rels,
      '</Relationships>',
      '<Relationship Id="rIdFirmaImg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/firma.jpg"/></Relationships>',
    )
    zip.file('word/_rels/document.xml.rels', rels)

    let tipos = await zip.file('[Content_Types].xml')!.async('string')
    if (!tipos.includes('Extension="jpg"')) {
      tipos = reemplazar(tipos, '</Types>', '<Default Extension="jpg" ContentType="image/jpeg"/></Types>')
      zip.file('[Content_Types].xml', tipos)
    }
  }

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}

export function descargarBlob(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  URL.revokeObjectURL(url)
}

export function nombreArchivoDeclaracion(expediente: Expediente): string {
  const carrera = expediente.carrera.replace(/\s+/g, ' ')
  return `ANEXO 18 - Declaración Jurada - ${carrera}.docx`
}
