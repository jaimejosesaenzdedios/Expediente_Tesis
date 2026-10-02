export const CARRERAS = [
  { carrera: 'Administración de Empresas', titulo: 'Licenciado en Administración de Empresas' },
  { carrera: 'Administración y Marketing', titulo: 'Licenciado en Administración y Marketing' },
  {
    carrera: 'Administración de Negocios Internacionales',
    titulo: 'Licenciado en Administración de Negocios Internacionales',
  },
  { carrera: 'Derecho', titulo: 'Abogado' },
  { carrera: 'Psicología', titulo: 'Licenciado en Psicología' },
  { carrera: 'Contabilidad', titulo: 'Contador público' },
  { carrera: 'Arquitectura', titulo: 'Arquitecto' },
  { carrera: 'Ingeniería de Sistemas', titulo: 'Ingeniero de Sistemas' },
  { carrera: 'Ingeniería Industrial', titulo: 'Ingeniero Industrial' },
  { carrera: 'Ingeniería Civil', titulo: 'Ingeniero Civil' },
] as const

export const PREFIJO_TITULO = 'Título profesional de'

export function tituloProfesionalDe(carrera: string): string {
  const encontrada = CARRERAS.find((opcion) => opcion.carrera === carrera)
  if (!encontrada) return ''
  return `${PREFIJO_TITULO} ${encontrada.titulo}`
}

export function esCarreraValida(carrera: string): boolean {
  return CARRERAS.some((opcion) => opcion.carrera === carrera)
}