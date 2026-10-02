import type { Expediente } from '../domain/types'

const CLAVE = 'expedientes.tesis.v1'
const CLAVE_ROL = 'sesion.rol'

export function leerRolActual(): string {
  return localStorage.getItem(CLAVE_ROL) ?? 'asesor'
}

export function guardarRolActual(rol: string): void {
  localStorage.setItem(CLAVE_ROL, rol)
}

const CLAVE_USUARIO = 'sesion.usuario'

export function leerUsuarioActual(): string {
  return localStorage.getItem(CLAVE_USUARIO) ?? ''
}

export function guardarUsuarioActual(usuario: string): void {
  localStorage.setItem(CLAVE_USUARIO, usuario)
}

export function guardarExpediente(expediente: Expediente): void {
  const existentes = leerExpedientes()
  localStorage.setItem(CLAVE, JSON.stringify([...existentes, expediente]))
}

export function actualizarExpediente(expediente: Expediente): void {
  const existentes = leerExpedientes()
  localStorage.setItem(
    CLAVE,
    JSON.stringify(existentes.map((registro) => (registro.id === expediente.id ? expediente : registro))),
  )
}

export function buscarExpediente(id: string): Expediente | undefined {
  return leerExpedientes().find((registro) => registro.id === id)
}

export function leerExpedientes(): Expediente[] {
  const contenido = localStorage.getItem(CLAVE)
  if (!contenido) return []
  try {
    const datos = JSON.parse(contenido)
    return Array.isArray(datos) ? (datos as Expediente[]) : []
  } catch {
    return []
  }
}

export function borrarExpedientes(): void {
  localStorage.removeItem(CLAVE)
}

export function crearId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `exp-${Date.now().toString(36)}`
}