import { useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Campo } from '../components/Campo'
import { CamposPersona } from '../components/CamposPersona'
import { CARRERAS, tituloProfesionalDe } from '../domain/carreras'
import { InformeUpload } from '../components/InformeUpload'
import type { Expediente } from '../domain/types'
import { MAX_ESTUDIANTES } from '../domain/types'
import { personaVacia } from '../domain/valores'
import { esquemaExpediente, type DatosExpediente } from '../domain/validations'
import { useSesion } from '../sesion/Sesion'
import { actualizarExpediente, crearId, guardarExpediente, leerExpedientes } from '../storage/expedientes'
import { mensajeEn } from '../utils/errores'
import { ResumenExpediente } from './ResumenExpediente'

const valoresIniciales = {
  carrera: '',
  informe: undefined,
  tituloFinal: '',
  asesor: personaVacia(),
  estudiantes: [personaVacia()],
}

type Props = {
  expedienteInicial?: Expediente | null
  alCancelarEdicion?: () => void
}

export function ExpedienteForm({ expedienteInicial, alCancelarEdicion }: Props) {
  const { nombreSesion } = useSesion()
  const [expediente, setExpediente] = useState<Expediente | null>(null)
  const [totalRegistrados, setTotalRegistrados] = useState(() => leerExpedientes().length)
  const editando = Boolean(expedienteInicial)

  const formulario = useForm<DatosExpediente>({
    resolver: zodResolver(esquemaExpediente),
    mode: 'onBlur',
    defaultValues: expedienteInicial
      ? {
          carrera: expedienteInicial.carrera,
          informe: expedienteInicial.informe,
          tituloFinal: expedienteInicial.tituloFinal,
          asesor: expedienteInicial.asesor,
          estudiantes: expedienteInicial.estudiantes,
        }
      : valoresIniciales,
  })

  const { register, control, handleSubmit, formState, reset } = formulario
  const { errors, isSubmitting } = formState
  const { fields, append, remove } = useFieldArray({ control, name: 'estudiantes' })

  const carrera = useWatch({ control, name: 'carrera' })
  const tituloProfesional = tituloProfesionalDe(carrera ?? '')

  const errorDe = (ruta: string) => mensajeEn(errors, ruta)

  const registrar = handleSubmit((datos) => {
    if (expedienteInicial) {
      const actualizado: Expediente = {
        ...expedienteInicial,
        carrera: datos.carrera,
        tituloProfesional: tituloProfesionalDe(datos.carrera),
        tituloFinal: datos.tituloFinal,
        informe: datos.informe,
        asesor: datos.asesor,
        estudiantes: datos.estudiantes,
        actualizadoEn: new Date().toISOString(),
      }
      actualizarExpediente(actualizado)
      setExpediente(actualizado)
      setTotalRegistrados(leerExpedientes().length)
      return
    }

    const nuevo: Expediente = {
      id: crearId(),
      carrera: datos.carrera,
      tituloProfesional: tituloProfesionalDe(datos.carrera),
      tituloFinal: datos.tituloFinal,
      informe: datos.informe,
      asesor: datos.asesor,
      estudiantes: datos.estudiantes,
      registradoPor: nombreSesion,
      creadoEn: new Date().toISOString(),
    }
    guardarExpediente(nuevo)
    setExpediente(nuevo)
    setTotalRegistrados(leerExpedientes().length)
  })

  if (expediente) {
    return (
      <ResumenExpediente
        expediente={expediente}
        totalRegistrados={totalRegistrados}
        editando={editando}
        alRegistrarOtro={() => {
          reset(valoresIniciales)
          setExpediente(null)
          alCancelarEdicion?.()
        }}
      />
    )
  }

  return (
    <form className="formulario" onSubmit={registrar} noValidate>
      {editando ? (
        <div className="tarjeta tarjeta--editando">
          <div className="editando">
            <div>
              <p className="editando__titulo">Editando expediente</p>
              <p className="editando__detalle">
                Modifique los datos que requiera y guarde los cambios. El registro conserva su código original.
              </p>
            </div>
            <button type="button" className="boton boton--fantasma" onClick={alCancelarEdicion}>
              Cancelar edición
            </button>
          </div>
        </div>
      ) : null}

      <section className="tarjeta">
        <div className="tarjeta__cabecera">
          <span className="paso">01</span>
          <div className="tarjeta__identificacion">
            <h2 className="tarjeta__titulo">Datos de la tesis</h2>
            <p className="tarjeta__descripcion">
              Registre el título final de la tesis tal como fue aprobado por el Programa de Titulación.
            </p>
          </div>
        </div>

        <div className="rejilla rejilla--tesis">
          <Campo
            id="carrera"
            etiqueta="Carrera profesional"
            requerido
            ayuda="El título profesional se muestra como referencia."
            error={errorDe('carrera')}
          >
            <select
              {...register('carrera')}
              className="entrada entrada--selector"
              aria-label="Carrera profesional"
            >
              <option value="">Seleccione una carrera</option>
              {CARRERAS.map((opcion) => (
                <option key={opcion.carrera} value={opcion.carrera}>
                  {opcion.carrera}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        {tituloProfesional ? (
          <p className="tarjeta__nota tarjeta__nota--resultado">
            <span className="tarjeta__nota-etiqueta">Título profesional</span>
            {tituloProfesional}
          </p>
        ) : null}

        <Campo
          id="tituloFinal"
          etiqueta="Título final de la tesis"
          requerido
          ayuda="Entre 10 y 200 caracteres, tal como aparece en la resolución de aprobación."
          error={errorDe('tituloFinal')}
        >
          <textarea
            {...register('tituloFinal')}
            className="entrada entrada--area"
            rows={3}
            placeholder="Efecto del aprendizaje basado en proyectos en el razonamiento científico de estudiantes de fifth grade"
            maxLength={200}
          />
        </Campo>

        <div className="informe__bloque">
          <div className="informe__cabecera">
            <h4 className="informe__titulo">Informe final de la tesis</h4>
            <p className="informe__descripcion">Adjunte el documento en formato PDF.</p>
          </div>
          <InformeUpload control={control} error={errorDe('informe') ?? errorDe('informe.dataUrl')} />
        </div>
      </section>

      <CamposPersona
        base="asesor"
        paso="02"
        titulo="Asesor"
        descripcion="Docente asesor del Programa de Titulación, responsable de la firma del expediente."
        registro={register}
        control={control}
        errorDe={errorDe}
      />

      <div className="tarjeta tarjeta--seccion">
        <div className="tarjeta__cabecera tarjeta__cabecera--accion">
          <div className="tarjeta__cabecera">
            <span className="paso">03</span>
            <div className="tarjeta__identificacion">
              <h2 className="tarjeta__titulo">Estudiantes asesorados</h2>
              <p className="tarjeta__descripcion">
                Registre hasta {MAX_ESTUDIANTES} estudiantes. Actualmente {fields.length} de {MAX_ESTUDIANTES}.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="boton boton--secundario"
            onClick={() => append(personaVacia())}
            disabled={fields.length >= MAX_ESTUDIANTES}
          >
            Agregar estudiante
          </button>
        </div>

        <p className="tarjeta__nota">
          {fields.length < MAX_ESTUDIANTES
            ? 'Puede agregar un segundo estudiante antes de enviar el expediente.'
            : 'Se alcanzó el máximo de dos estudiantes permitido por expediente.'}
        </p>

        {fields.map((campo, indice) => (
          <div className="estudiante" key={campo.id}>
            <CamposPersona
              base={`estudiantes.${indice}`}
              paso={`03.${indice + 1}`}
              titulo={`Estudiante ${indice + 1}`}
              descripcion={
                indice === 0
                  ? 'Titular del Programa de Titulación y firmante del expediente.'
                  : 'Segundo firmante del Programa de Titulación.'
              }
              registro={register}
              control={control}
              errorDe={errorDe}
            />
            {fields.length > 1 ? (
              <div className="estudiante__pie">
                <button type="button" className="boton boton--peligro" onClick={() => remove(indice)}>
                  Quitar estudiante {indice + 1}
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="barra">
        <div className="barra__texto">
          <p className="barra__titulo">{editando ? 'Guardar cambios' : 'Cierre del expediente'}</p>
          <p className="barra__detalle">
            {editando
              ? 'Se actualizará el expediente conservando su código y fecha de registro originales.'
              : 'Al registrar se guardan los datos y las firmas en este equipo. Revise antes de continuar.'}
          </p>
        </div>
        <button type="submit" className="boton boton--primario boton--grande" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar expediente'}
        </button>
      </div>
    </form>
  )
}