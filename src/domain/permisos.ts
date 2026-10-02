import type { Rol } from '../sesion/Sesion'
import type { Expediente } from './types'

export function puedeRegistrar(rol: Rol): boolean {
  return rol === 'asesor' || rol === 'coordinador'
}

export function puedeVerExpedientes(rol: Rol): boolean {
  return puedeRegistrar(rol)
}

export function expedientesVisibles(expedientes: Expediente[], rol: Rol, usuario: string): Expediente[] {
  if (rol === 'asesor') return expedientes.filter((registro) => registro.registradoPor === usuario)
  if (rol === 'coordinador') return expedientes
  return []
}