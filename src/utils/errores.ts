export function mensajeEn(error: unknown, ruta: string): string | undefined {
  let actual: unknown = error

  for (const parte of ruta.split('.')) {
    if (typeof actual !== 'object' || actual === null) return undefined
    actual = (actual as Record<string, unknown>)[parte]
  }

  if (typeof actual === 'object' && actual !== null && 'message' in actual) {
    const { message } = actual as { message?: unknown }
    return typeof message === 'string' ? message : undefined
  }

  return undefined
}