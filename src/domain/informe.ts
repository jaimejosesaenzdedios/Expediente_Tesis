export type Informe = {
  nombreArchivo: string
  tipoMime: string
  bytes: number
  dataUrl: string
}

export function informeVacio(): Informe {
  return { nombreArchivo: '', tipoMime: '', bytes: 0, dataUrl: '' }
}

export function formatearBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}