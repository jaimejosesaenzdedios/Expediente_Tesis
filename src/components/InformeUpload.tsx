import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Controller, type Control } from 'react-hook-form'
import { formatearBytes, informeVacio, type Informe } from '../domain/informe'
import type { DatosExpediente } from '../domain/validations'

type Props = {
  control: Control<DatosExpediente>
  error?: string
}

export function InformeUpload({ control, error }: Props) {
  const [procesando, setProcesando] = useState(false)
  const [errorArchivo, setErrorArchivo] = useState<string | undefined>(undefined)
  const [arrastrando, setArrastrando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function cargarArchivo(archivo: File | undefined, actualizar: (informe: Informe | undefined) => void) {
    if (!archivo) return
    setProcesando(true)
    try {
      if (archivo.type !== 'application/pdf') {
        throw new Error('El informe debe ser un archivo PDF')
      }
      const dataUrl = await new Promise<string>((resolver, rechazar) => {
        const lector = new FileReader()
        lector.onload = () => resolver(String(lector.result))
        lector.onerror = () => rechazar(new Error('No se pudo leer el archivo'))
        lector.readAsDataURL(archivo)
      })
      actualizar({
        nombreArchivo: archivo.name,
        tipoMime: archivo.type,
        bytes: archivo.size,
        dataUrl,
      })
      setErrorArchivo(undefined)
    } catch (fallo) {
      actualizar(undefined)
      setErrorArchivo(fallo instanceof Error ? fallo.message : 'No se pudo cargar el archivo')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <Controller
      control={control}
      name="informe"
      render={({ field }) => {
        const informe = (field.value as Informe | undefined) ?? informeVacio()
        const cargado = Boolean(informe.dataUrl)
        const mensaje = error ?? errorArchivo

        return (
          <div className="informe">
            <div
              className={
                [
                  'informe__zona',
                  arrastrando ? 'informe__zona--arrastrando' : '',
                  cargado ? 'informe__zona--cargado' : '',
                  mensaje ? 'informe__zona--error' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
              }
              onDragOver={(evento: DragEvent<HTMLDivElement>) => {
                evento.preventDefault()
                setArrastrando(true)
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(evento: DragEvent<HTMLDivElement>) => {
                evento.preventDefault()
                setArrastrando(false)
                void cargarArchivo(evento.dataTransfer.files[0], field.onChange)
              }}
            >
              {cargado ? (
                <div className="informe__previa">
                  <span className="informe__icono" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M6 2h8l4 4v16H6z" strokeLinejoin="round" />
                      <path d="M14 2v4h4" strokeLinejoin="round" />
                      <path d="M9 13h6M9 17h6" strokeLinecap="round" />
                    </svg>
                  </span>
                  <dl className="informe__metadatos">
                    <div>
                      <dt>Archivo</dt>
                      <dd>{informe.nombreArchivo}</dd>
                    </div>
                    <div>
                      <dt>Tamaño</dt>
                      <dd>{formatearBytes(informe.bytes)}</dd>
                    </div>
                    <div>
                      <dt>Formato</dt>
                      <dd>PDF</dd>
                    </div>
                    <div>
                      <dt>Estado</dt>
                      <dd className="informe__estado">Cargado</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="informe__vacio">
                  <span className="informe__icono" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M6 2h8l4 4v16H6z" strokeLinejoin="round" />
                      <path d="M14 2v4h4" strokeLinejoin="round" />
                      <path d="M9 13h6M9 17h6" strokeLinecap="round" />
                    </svg>
                  </span>
                  <p className="informe__instruccion">
                    {procesando ? 'Procesando archivo...' : 'Arrastre el informe final en PDF o selecciónelo'}
                  </p>
                  <p className="informe__formatos">Solo formato PDF</p>
                </div>
              )}

              <div className="informe__acciones">
                <button
                  type="button"
                  className="boton boton--primario"
                  onClick={() => inputRef.current?.click()}
                  disabled={procesando}
                >
                  {cargado ? 'Reemplazar PDF' : 'Seleccionar PDF'}
                </button>
                {cargado ? (
                  <button
                    type="button"
                    className="boton boton--fantasma"
                    onClick={() => {
                      field.onChange(undefined)
                      setErrorArchivo(undefined)
                    }}
                  >
                    Quitar
                  </button>
                ) : null}
              </div>

              <input
                ref={inputRef}
                className="carga__nativo"
                type="file"
                tabIndex={-1}
                accept="application/pdf,.pdf"
                aria-label="Informe final de la tesis en PDF"
                onChange={(evento: ChangeEvent<HTMLInputElement>) => {
                  void cargarArchivo(evento.target.files?.[0], field.onChange)
                  evento.target.value = ''
                }}
              />
            </div>

            {mensaje ? (
              <p className="carga__aviso" role="alert">
                {mensaje}
              </p>
            ) : null}
          </div>
        )
      }}
    />
  )
}