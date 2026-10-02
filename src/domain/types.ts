export type Firma = {
  nombreArchivo: string
  tipoMime: string
  bytes: number
  anchoPx: number
  altoPx: number
  dataUrl: string
}

export type Persona = {
  codigo: string
  nombres: string
  apellidos: string
  dni: string
  orcid: string
  email: string
  firma: Firma
}

export type Expediente = {
  id: string
  carrera: string
  tituloProfesional: string
  tituloFinal: string
  informe?: Informe
  asesor: Persona
  estudiantes: Persona[]
  registradoPor: string
  creadoEn: string
  actualizadoEn?: string
}

export const MAX_ESTUDIANTES = 2

import type { Informe } from './informe'

export type { Informe }