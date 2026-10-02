import type { Firma, Persona } from './types'

export function firmaVacia(): Firma {
  return { nombreArchivo: '', tipoMime: '', bytes: 0, anchoPx: 0, altoPx: 0, dataUrl: '' }
}

export function personaVacia(): Persona {
  return {
    codigo: '',
    nombres: '',
    apellidos: '',
    dni: '',
    orcid: '',
    email: '',
    firma: firmaVacia(),
  }
}