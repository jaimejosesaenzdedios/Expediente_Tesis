import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Controller, type Control } from 'react-hook-form'
import type { Firma } from '../domain/types'
import { firmaVacia } from '../domain/valores'
import type { DatosExpediente } from '../domain/validations'
import { procesarFirma } from '../utils/firma'

export type CampoFirma = `asesor.firma` | `estudiantes.${number}.firma`

type Props = {
  nombre: CampoFirma
  control: Control<DatosExpediente>
  descripcion: string
  error?: string
}

export function FirmaUpload({ nombre, control, descripcion, error }: Props) {
  const [procesando, setProcesando] = useState(false)
  const [errorArchivo, setErrorArchivo] = useState<string | undefined>(undefined)
  const [arrastrando, setArrastrando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function cargarArchivo(archivo: File | undefined, actualizar: (firma: Firma) => void) {
    if (!archivo) return
    setProcesando(true)
    try {
      actualizar(await procesarFirma(archivo))
      setErrorArchivo(undefined)
    } catch (fallo) {
      actualizar(firmaVacia())
      setErrorArchivo(fallo instanceof Error ? fallo.message : 'No se pudo procesar la imagen')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <Controller
      control={control}
      name={nombre}
      render={({ field }) => {
        const firma = (field.value as Firma | undefined) ?? firmaVacia()
        const mensaje = error ?? errorArchivo

        return (
          <div className="carga">
            <div
              className={
                [
                  'carga__zona',
                  arrastrando ? 'carga__zona--arrastrando' : '',
                  firma.dataUrl ? 'carga__zona--cargada' : '',
                  mensaje ? 'carga__zona--error' : '',
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
              onClick={(evento) => {
                if (evento.target === evento.currentTarget) inputRef.current?.click()
              }}
            >
              {firma.dataUrl ? (
                <div className="carga__previa">
                  <div className="carga__marco">
                    <img className="carga__vista" src={firma.dataUrl} alt={`Firma de ${descripcion}`} />
                  </div>
                  <dl className="carga__metadatos">
                    <div>
                      <dt>Archivo</dt>
                      <dd>{firma.nombreArchivo}</dd>
                    </div>
                    <div>
                      <dt>Dimensiones</dt>
                      <dd>
                        {firma.anchoPx} x {firma.altoPx} px
                      </dd>
                    </div>
                    <div>
                      <dt>Estado</dt>
                      <dd className="carga__estado">Cargada</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="carga__vacio">
                  <span className="carga__icono" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M12 16V4m0 0L8 8m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" />
                    </svg>
                  </span>
                  <p className="carga__instruccion">
                    {procesando
                      ? 'Procesando imagen...'
                      : 'Arrastre la imagen de la firma o use el botón para seleccionarla'}
                  </p>
                  <p className="carga__formatos">PNG, JPG o WEBP · máximo 5 MB</p>
                </div>
              )}

              <div className="carga__acciones">
                <button
                  type="button"
                  className="boton boton--primario"
                  onClick={() => inputRef.current?.click()}
                  disabled={procesando}
                >
                  {firma.dataUrl ? 'Reemplazar imagen' : 'Seleccionar imagen'}
                </button>
                {firma.dataUrl ? (
                  <button
                    type="button"
                    className="boton boton--fantasma"
                    onClick={() => {
                      field.onChange(firmaVacia())
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
                accept="image/png,image/jpeg,image/webp"
                aria-label={`Firma de ${descripcion}`}
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