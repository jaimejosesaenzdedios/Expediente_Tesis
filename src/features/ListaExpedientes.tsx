import { useState } from 'react'
import { descargarBlob, generarDeclaracion, nombreArchivoDeclaracion } from '../utils/declaracion'
import type { Expediente } from '../domain/types'

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })
}

type Props = {
  expedientes: Expediente[]
  alEditar: (expediente: Expediente) => void
  alNuevo: () => void
  soloPropios: boolean
  usuario: string
}

export function ListaExpedientes({ expedientes, alEditar, alNuevo, soloPropios, usuario }: Props) {
  const [generandoId, setGenerandoId] = useState<string | null>(null)

  async function generar(expediente: Expediente) {
    setGenerandoId(expediente.id)
    try {
      const blob = await generarDeclaracion(expediente)
      descargarBlob(blob, nombreArchivoDeclaracion(expediente))
    } finally {
      setGenerandoId(null)
    }
  }

  if (expedientes.length === 0) {
    return (
      <section className="tarjeta tarjeta--vacia">
        <div className="vacia">
          <p className="vacia__titulo">Aún no hay expedientes registrados</p>
          <p className="vacia__detalle">
            Cuando el asesor registre un expediente de tesis aparecerá en esta lista y podrá editarlo si surge una
            observación.
          </p>
          <button type="button" className="boton boton--primario" onClick={alNuevo}>
            Registrar el primer expediente
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="tarjeta">
      <div className="tarjeta__cabecera tarjeta__cabecera--accion">
        <div className="tarjeta__cabecera">
          <div className="tarjeta__identificacion">
            <h2 className="tarjeta__titulo">{soloPropios ? 'Mis expedientes' : 'Expedientes registrados'}</h2>
            <p className="tarjeta__descripcion">
              {soloPropios
                ? `Solo se muestran los expedientes registrados con el usuario ${usuario}. Total: ${expedientes.length}.`
                : `Se muestran todos los expedientes del Programa de Titulación. Total: ${expedientes.length}.`}
            </p>
          </div>
        </div>
        <button type="button" className="boton boton--primario" onClick={alNuevo}>
          Nuevo expediente
        </button>
      </div>

      <ul className="lista">
        {expedientes.map((expediente) => (
          <li className="lista__itemo" key={expediente.id}>
            <div className="lista__datos">
              <p className="lista__carrera">{expediente.carrera}</p>
              <p className="lista__titulo">{expediente.tituloFinal}</p>
              <p className="lista__meta">
                {expediente.estudiantes.length} {expediente.estudiantes.length === 1 ? 'estudiante' : 'estudiantes'} ·
                registrado el {formatearFecha(expediente.creadoEn)}
              </p>
            </div>
            <div className="lista__lado">
              {expediente.actualizadoEn ? (
                <span className="lista__estado">Actualizado</span>
              ) : (
                <span className="lista__estado lista__estado--nuevo">Registrado</span>
              )}
              <button
                type="button"
                className="boton boton--fantasma"
                onClick={() => void generar(expediente)}
                disabled={generandoId === expediente.id}
                title="Descargar ANEXO 18"
              >
                {generandoId === expediente.id ? 'Generando...' : 'Declaración'}
              </button>
              <button
                type="button"
                className="boton boton--secundario"
                onClick={() => alEditar(expediente)}
              >
                Editar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}