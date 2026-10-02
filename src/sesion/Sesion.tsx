import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { guardarRolActual, guardarUsuarioActual, leerRolActual, leerUsuarioActual } from '../storage/expedientes'

export const ROLES = ['asesor', 'coordinador', 'estudiante'] as const
export type Rol = (typeof ROLES)[number]

export const USUARIO_POR_DEFECTO = 'DOC-0001'

type Sesion = {
  rol: Rol
  nombreSesion: string
  usuario: string
  cambiarRol: (rol: Rol) => void
  cambiarUsuario: (usuario: string) => void
}

const ContextoSesion = createContext<Sesion | null>(null)

const NOMBRES_POR_ROL: Record<Rol, string> = {
  asesor: 'Docente asesor',
  coordinador: 'Coordinador de PT',
  estudiante: 'Estudiante',
}

export function ProveedorDeSesion({ children }: { children: ReactNode }) {
  const [rol, setRol] = useState<Rol>(() => {
    const guardado = leerRolActual()
    return (ROLES as readonly string[]).includes(guardado) ? (guardado as Rol) : 'asesor'
  })

  const [usuario, setUsuario] = useState<string>(() => leerUsuarioActual() || USUARIO_POR_DEFECTO)

  const cambiarRol = useCallback((nuevoRol: Rol) => {
    setRol(nuevoRol)
    guardarRolActual(nuevoRol)
  }, [])

  const cambiarUsuario = useCallback((nuevoUsuario: string) => {
    const limpio = nuevoUsuario.trim() || USUARIO_POR_DEFECTO
    setUsuario(limpio)
    guardarUsuarioActual(limpio)
  }, [])

  const valor = useMemo<Sesion>(
    () => ({ rol, nombreSesion: NOMBRES_POR_ROL[rol], usuario, cambiarRol, cambiarUsuario }),
    [rol, usuario, cambiarRol, cambiarUsuario],
  )

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>
}

export function useSesion(): Sesion {
  const sesion = useContext(ContextoSesion)
  if (!sesion) throw new Error('useSesion debe usarse dentro de ProveedorDeSesion')
  return sesion
}

export function useEsAsesor(): boolean {
  return useSesion().rol === 'asesor'
}

export function usePuedeRegistrar(): boolean {
  const { rol } = useSesion()
  return rol === 'asesor' || rol === 'coordinador'
}