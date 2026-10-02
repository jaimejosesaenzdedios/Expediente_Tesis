import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { readFileSync } from 'node:fs'
import { generarDeclaracion, transformarDocumento } from '../src/utils/declaracion'
import type { Expediente } from '../src/domain/types'

const rutaPlantilla = new URL('../public/plantillas/ANEXO 18- DJ Asesor.docx', import.meta.url)

async function xmlDePlantilla(): Promise<string> {
  const zip = await JSZip.loadAsync(readFileSync(rutaPlantilla))
  return zip.file('word/document.xml')!.async('string')
}

function textoPlano(xml: string): string {
  return xml
    .replace(/<w:tab[^>]*/g, '\t')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function expedienteDePrueba(): Expediente {
  return {
    id: 'test-1',
    carrera: 'Derecho',
    tituloProfesional: 'Título profesional de Abogado',
    tituloFinal: 'La responsabilidad civil en los accidentes de tránsito',
    asesor: {
      codigo: 'A01234',
      nombres: 'María Elena',
      apellidos: 'Quispe Rojas',
      dni: '70123456',
      orcid: '0000-0002-1825-0097',
      email: 'mquispe@universidad.edu.pe',
      firma: {
        nombreArchivo: 'firma.jpg',
        tipoMime: 'image/jpeg',
        bytes: 1200,
        anchoPx: 300,
        altoPx: 90,
        dataUrl: 'data:image/jpeg;base64,AAAA',
      },
    },
    estudiantes: [
      {
        codigo: 'E001',
        nombres: 'Juan Carlos',
        apellidos: 'Paredes Soto',
        dni: '70111222',
        orcid: '0000-0002-1825-010X',
        email: 'jparedes@universidad.edu.pe',
        firma: {
          nombreArchivo: 'firma2.jpg',
          tipoMime: 'image/jpeg',
          bytes: 1000,
          anchoPx: 300,
          altoPx: 90,
          dataUrl: 'data:image/jpeg;base64,BBBB',
        },
      },
      {
        codigo: 'E002',
        nombres: 'Ana Lucía',
        apellidos: 'Gómez Ruiz',
        dni: '70333444',
        orcid: '0000-0002-1825-0118',
        email: 'agomez@universidad.edu.pe',
        firma: {
          nombreArchivo: 'firma3.jpg',
          tipoMime: 'image/jpeg',
          bytes: 1000,
          anchoPx: 300,
          altoPx: 90,
          dataUrl: 'data:image/jpeg;base64,CCCC',
        },
      },
    ],
    registradoPor: 'DOC-0001',
    creadoEn: '2026-01-01T10:00:00.000Z',
  }
}

describe('transformarDocumento', () => {
  it('reemplaza los placeholders principales', async () => {
    const xml = transformarDocumento(await xmlDePlantilla(), expedienteDePrueba(), new Date(2026, 4, 9))
    const texto = textoPlano(xml)

    expect(texto).toContain('María Elena Quispe Rojas')
    expect(texto).toContain('70123456')
    expect(texto).toContain('Derecho')
    expect(texto).toContain('La responsabilidad civil en los accidentes de tránsito')
    expect(texto).toContain('Título profesional de Abogado')
    expect(texto).toContain('Juan Carlos Paredes Soto y Ana Lucía Gómez Ruiz')
    expect(texto).toContain('09; de mayo de 2026')
  })

  it('elimina los placeholders sin usar', async () => {
    const xml = transformarDocumento(await xmlDePlantilla(), expedienteDePrueba(), new Date(2026, 4, 9))
    const texto = textoPlano(xml)

    expect(texto).not.toContain('[Asesor]')
    expect(texto).not.toContain('[DNI_ASESOR')
    expect(texto).not.toContain('[CARRERA]')
    expect(texto).not.toContain('de Licenciado')
  })

  it('maneja un solo estudiante', async () => {
    const expediente = expedienteDePrueba()
    expediente.estudiantes = [expediente.estudiantes[0]]
    const xml = transformarDocumento(await xmlDePlantilla(), expediente, new Date(2026, 4, 9))
    const texto = textoPlano(xml)

    expect(texto).toContain('el tesista Juan Carlos Paredes Soto')
    expect(texto).not.toContain('y Ana Lucía')
  })

  it('inserta el dibujo de la firma en el documento', async () => {
    const xml = transformarDocumento(await xmlDePlantilla(), expedienteDePrueba(), new Date(2026, 4, 9))
    expect(xml).toContain('r:embed="rIdFirmaImg"')
    expect(xml).toContain('wp:inline')
  })

  it('genera un docx válido con la imagen y la relación', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () =>
      new Response(readFileSync(rutaPlantilla), { status: 200 })) as typeof fetch

    try {
      const zip = await JSZip.loadAsync(readFileSync(rutaPlantilla))
      const xmlOriginal = await zip.file('word/document.xml')!.async('string')
      const blob = await generarDeclaracion(expedienteDePrueba())
      const generado = await JSZip.loadAsync(await blob.arrayBuffer())

      const xml = await generado.file('word/document.xml')!.async('string')
      const rels = await generado.file('word/_rels/document.xml.rels')!.async('string')
      const tipos = await generado.file('[Content_Types].xml')!.async('string')

      expect(xml).toContain('r:embed="rIdFirmaImg"')
      expect(rels).toContain('Target="media/firma.jpg"')
      expect(tipos).toContain('Extension="jpg"')
      expect(await generado.file('word/media/firma.jpg')!.async('string')).not.toBe('')
      expect(xmlOriginal).not.toBe(xml)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('escapa caracteres especiales', async () => {
    const expediente = expedienteDePrueba()
    expediente.tituloFinal = 'Análisis & crítica <de la norma>'
    const xml = transformarDocumento(await xmlDePlantilla(), expediente, new Date(2026, 4, 9))
    expect(xml).toContain('Análisis &amp; crítica &lt;de la norma&gt;')
  })
})