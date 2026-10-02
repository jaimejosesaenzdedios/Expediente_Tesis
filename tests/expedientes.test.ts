import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  actualizarExpediente,
  borrarExpedientes,
  buscarExpediente,
  guardarExpediente,
  leerExpedientes,
} from '../src/storage/expedientes'
import type { Expediente } from '../src/domain/types'

function expedienteDePrueba(id: string, titulo = 'Título de prueba'): Expediente {
  return {
    id,
    carrera: 'Derecho',
    tituloProfesional: 'Título profesional de Abogado',
    tituloFinal: titulo,
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
    registradoPor: 'Docente asesor',
    creadoEn: '2026-01-01T10:00:00.000Z',
  }
}

describe('expedientes en localStorage', () => {
  beforeEach(() => {
    const almacen = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (clave: string) => almacen.get(clave) ?? null,
      setItem: (clave: string, valor: string) => void almacen.set(clave, valor),
      removeItem: (clave: string) => void almacen.delete(clave),
      clear: () => almacen.clear(),
      key: (indice: number) => Array.from(almacen.keys())[indice] ?? null,
      get length() {
        return almacen.size
      },
    })
    borrarExpedientes()
  })

  it('guarda y lista expedientes', () => {
    guardarExpediente(expedienteDePrueba('1'))
    guardarExpediente(expedienteDePrueba('2'))
    expect(leerExpedientes()).toHaveLength(2)
  })

  it('actualiza un expediente conservando su id', () => {
    guardarExpediente(expedienteDePrueba('abc', 'Título original'))
    const original = buscarExpediente('abc')
    expect(original?.tituloFinal).toBe('Título original')

    actualizarExpediente({ ...original!, tituloFinal: 'Título corregido', actualizadoEn: '2026-02-02T12:00:00.000Z' })

    const registros = leerExpedientes()
    expect(registros).toHaveLength(1)
    expect(registros[0].tituloFinal).toBe('Título corregido')
    expect(registros[0].actualizadoEn).toBe('2026-02-02T12:00:00.000Z')
    expect(registros[0].creadoEn).toBe('2026-01-01T10:00:00.000Z')
  })

  it('no duplica registros al actualizar', () => {
    guardarExpediente(expedienteDePrueba('1'))
    guardarExpediente(expedienteDePrueba('2'))
    const primero = buscarExpediente('1')!

    actualizarExpediente({ ...primero, tituloFinal: 'Otro título' })

    expect(leerExpedientes()).toHaveLength(2)
    expect(buscarExpediente('2')).toBeDefined()
  })

  it('devuelve undefined si el id no existe', () => {
    expect(buscarExpediente('inexistente')).toBeUndefined()
  })
})