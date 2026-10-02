import { describe, expect, it } from 'vitest'
import { expedientesVisibles, puedeRegistrar, puedeVerExpedientes } from '../src/domain/permisos'
import type { Expediente } from '../src/domain/types'

function expediente(id: string, registradoPor: string): Expediente {
  return {
    id,
    carrera: 'Derecho',
    tituloProfesional: 'Título profesional de Abogado',
    tituloFinal: 'Título de prueba',
    asesor: {
      codigo: 'A01234',
      nombres: 'María Elena',
      apellidos: 'Quispe Rojas',
      dni: '70123456',
      orcid: '0000-0002-1825-0097',
      email: 'mquispe@universidad.edu.pe',
      firma: {
        nombreArchivo: 'firma.png',
        tipoMime: 'image/png',
        bytes: 1200,
        anchoPx: 300,
        altoPx: 90,
        dataUrl: 'data:image/png;base64,AAAA',
      },
    },
    estudiantes: [],
    registradoPor,
    creadoEn: '2026-01-01T10:00:00.000Z',
  }
}

const registros = [
  expediente('1', 'DOC-0001'),
  expediente('2', 'DOC-0001'),
  expediente('3', 'DOC-0002'),
]

describe('permisos por rol', () => {
  it('el asesor y el coordinador pueden registrar', () => {
    expect(puedeRegistrar('asesor')).toBe(true)
    expect(puedeRegistrar('coordinador')).toBe(true)
    expect(puedeRegistrar('estudiante')).toBe(false)
  })

  it('solo asesor y coordinador ven expedientes', () => {
    expect(puedeVerExpedientes('asesor')).toBe(true)
    expect(puedeVerExpedientes('coordinador')).toBe(true)
    expect(puedeVerExpedientes('estudiante')).toBe(false)
  })

  it('el asesor solo ve sus propios registros', () => {
    const visibles = expedientesVisibles(registros, 'asesor', 'DOC-0001')
    expect(visibles.map((e) => e.id)).toEqual(['1', '2'])
  })

  it('el asesor no ve registros de otros docentes', () => {
    expect(expedientesVisibles(registros, 'asesor', 'DOC-0003')).toEqual([])
  })

  it('el coordinador ve todos los registros', () => {
    expect(expedientesVisibles(registros, 'coordinador', 'DOC-0001')).toHaveLength(3)
  })

  it('el estudiante no ve ningún registro', () => {
    expect(expedientesVisibles(registros, 'estudiante', 'DOC-0001')).toEqual([])
  })
})