import { useState } from 'react'
import { formatearBytes } from '../domain/informe'
import { descargarBlob, generarDeclaracion, nombreArchivoDeclaracion } from '../utils/declaracion'
import type { Expediente } from '../domain/types'

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' })
}

type Props = {
  expediente: Expediente
  totalRegistrados: number
  editando?: boolean
  alRegistrarOtro: () => void
}

export function ResumenExpediente({ expediente, totalRegistrados, editando, alRegistrarOtro }: Props) {
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  async function generar() {
    setGenerando(true)
    setError(undefined)
    try {
      const blob = await generarDeclaracion(expediente)
      descargarBlob(blob, nombreArchivoDeclaracion(expediente))
    } catch {
      setError('No se pudo generar el documento. Intente nuevamente.')
    } finally {
      setGenerando(false)
    }
  }

  const participantes = [
    { rol: 'Asesor', persona: expediente.asesor },
    ...expediente.estudiantes.map((persona, indice) => ({ rol: `Estudiante ${indice + 1}`, persona })),
  ]

  return (
    <section className="tarjeta tarjeta--exito" aria-live="polite">
      <div className="tarjeta__cabecera tarjeta__cabecera--accion">
        <div className="tarjeta__cabecera">
          <span className="sello">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="m5 12.5 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="tarjeta__identificacion">
            <h2 className="tarjeta__titulo">{editando ? 'Expediente actualizado' : 'Expediente registrado'}</h2>
            <p className="tarjeta__descripcion">
              Programa de Titulación (PT) · UTP. {editando ? 'Los cambios quedaron guardados.' : 'Los datos y las firmas quedaron guardados en este equipo.'}
            </p>
          </div>
        </div>
        <span className="codigo">{expediente.id.slice(0, 8).toUpperCase()}</span>
      </div>

      <dl className="ficha">
        <div className="ficha__fila">
          <dt>Carrera profesional</dt>
          <dd>{expediente.carrera}</dd>
        </div>
        <div className="ficha__fila">
          <dt>Título profesional</dt>
          <dd>{expediente.tituloProfesional}</dd>
        </div>
        <div className="ficha__fila">
          <dt>Título final de la tesis</dt>
          <dd>{expediente.tituloFinal}</dd>
        </div>
        <div className="ficha__fila">
          <dt>Informe final</dt>
          <dd>
            {expediente.informe?.dataUrl ? (
              <a
                className="informe__enlace"
                href={expediente.informe.dataUrl}
                download={expediente.informe.nombreArchivo}
              >
                {expediente.informe.nombreArchivo} · {formatearBytes(expediente.informe.bytes)}
              </a>
            ) : (
              'No adjunto'
            )}
          </dd>
        </div>
        <div className="ficha__fila">
          <dt>Unidad</dt>
          <dd>Programa de Titulación (PT) · Universidad Tecnológica del Perú</dd>
        </div>
        <div className="ficha__fila">
          <dt>Registrado por</dt>
          <dd>{expediente.registradoPor}</dd>
        </div>
        <div className="ficha__fila">
          <dt>Fecha de registro</dt>
          <dd>{formatearFecha(expediente.creadoEn)}</dd>
        </div>
        {expediente.actualizadoEn ? (
          <div className="ficha__fila">
            <dt>Última actualización</dt>
            <dd>{formatearFecha(expediente.actualizadoEn)}</dd>
          </div>
        ) : null}
        <div className="ficha__fila">
          <dt>Expedientes en este equipo</dt>
          <dd>{totalRegistrados}</dd>
        </div>
      </dl>

      <h3 className="bloque__titulo">Participantes y firmas</h3>
      <div className="resumen">
        {participantes.map(({ rol, persona }) => (
          <article className="resumen__persona" key={persona.dni}>
            <header className="resumen__encabezado">
              <p className="resumen__rol">{rol}</p>
              <p className="resumen__nombre">
                {persona.nombres} {persona.apellidos}
              </p>
            </header>
            <dl className="resumen__datos">
              <div>
                <dt>Código</dt>
                <dd>{persona.codigo}</dd>
              </div>
              <div>
                <dt>DNI</dt>
                <dd>{persona.dni}</dd>
              </div>
              <div>
                <dt>ORCID</dt>
                <dd>{persona.orcid}</dd>
              </div>
              <div>
                <dt>Correo</dt>
                <dd>{persona.email}</dd>
              </div>
            </dl>
            {persona.firma.dataUrl ? (
              <div className="resumen__firma">
                <span className="resumen__firma-etiqueta">Firma</span>
                <img className="resumen__firma-imagen" src={persona.firma.dataUrl} alt={`Firma de ${persona.nombres}`} />
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {error ? (
        <p className="carga__aviso" role="alert">
          {error}
        </p>
      ) : null}

      <div className="barra">
        <div className="barra__texto">
          <p className="barra__titulo">Documento del expediente</p>
          <p className="barra__detalle">
            Descargue la Declaración Jurada de Autenticidad y No Plagio (ANEXO 18) con los datos y la firma del
            asesor.
          </p>
        </div>
        <div className="barra__acciones">
          <button
            type="button"
            className="boton boton--secundario"
            onClick={() => void generar()}
            disabled={generando}
          >
            {generando ? 'Generando...' : 'Generar declaración (.docx)'}
          </button>
          <button type="button" className="boton boton--primario" onClick={alRegistrarOtro}>
            Registrar otro expediente
          </button>
        </div>
      </div>
    </section>
  )
}