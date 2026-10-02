import type { Control, Path, UseFormRegister } from 'react-hook-form'
import type { DatosExpediente } from '../domain/validations'
import { normalizarDni, normalizarOrcid } from '../domain/validations'
import { Campo } from './Campo'
import { FirmaUpload, type CampoFirma } from './FirmaUpload'

export type BasePersona = 'asesor' | `estudiantes.${number}`

type CampoDePersona = 'codigo' | 'dni' | 'nombres' | 'apellidos' | 'orcid' | 'email' | 'firma'

type Props = {
  base: BasePersona
  paso: string
  titulo: string
  descripcion: string
  registro: UseFormRegister<DatosExpediente>
  control: Control<DatosExpediente>
  errorDe: (ruta: string) => string | undefined
}

function ruta(base: BasePersona, campo: CampoDePersona): Path<DatosExpediente> {
  return `${base}.${campo}`
}

export function CamposPersona({ base, paso, titulo, descripcion, registro, control, errorDe }: Props) {
  return (
    <fieldset className="tarjeta">
      <div className="tarjeta__cabecera">
        <span className="paso">{paso}</span>
        <div className="tarjeta__identificacion">
          <legend className="tarjeta__titulo">{titulo}</legend>
          <p className="tarjeta__descripcion">{descripcion}</p>
        </div>
      </div>

      <div className="rejilla">
        <Campo id={ruta(base, 'codigo')} etiqueta="Código" requerido error={errorDe(ruta(base, 'codigo'))}>
          <input
            {...registro(ruta(base, 'codigo'))}
            className="entrada"
            type="text"
            autoComplete="off"
            placeholder="A01234"
            maxLength={20}
          />
        </Campo>

        <Campo id={ruta(base, 'dni')} etiqueta="DNI" requerido error={errorDe(ruta(base, 'dni'))}>
          <input
            {...registro(ruta(base, 'dni'), { setValueAs: normalizarDni })}
            className="entrada"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="70123456"
            maxLength={8}
          />
        </Campo>

        <Campo
          id={ruta(base, 'nombres')}
          etiqueta="Nombres"
          requerido
          error={errorDe(ruta(base, 'nombres'))}
        >
          <input
            {...registro(ruta(base, 'nombres'))}
            className="entrada"
            type="text"
            autoComplete="off"
            placeholder="María Elena"
            maxLength={60}
          />
        </Campo>

        <Campo
          id={ruta(base, 'apellidos')}
          etiqueta="Apellidos"
          requerido
          error={errorDe(ruta(base, 'apellidos'))}
        >
          <input
            {...registro(ruta(base, 'apellidos'))}
            className="entrada"
            type="text"
            autoComplete="off"
            placeholder="Quispe Rojas"
            maxLength={60}
          />
        </Campo>

        <Campo
          id={ruta(base, 'orcid')}
          etiqueta="Código ORCID"
          requerido
          ayuda="Formato 0000-0000-0000-0000"
          error={errorDe(ruta(base, 'orcid'))}
        >
          <input
            {...registro(ruta(base, 'orcid'), { setValueAs: normalizarOrcid })}
            className="entrada"
            type="text"
            autoComplete="off"
            placeholder="0000-0002-1825-0097"
            maxLength={19}
          />
        </Campo>

        <Campo
          id={ruta(base, 'email')}
          etiqueta="Correo electrónico"
          requerido
          error={errorDe(ruta(base, 'email'))}
        >
          <input
            {...registro(ruta(base, 'email'))}
            className="entrada"
            type="email"
            autoComplete="off"
            placeholder="nombre@universidad.edu.pe"
            maxLength={80}
          />
        </Campo>
      </div>

      <div className="firma">
        <div className="firma__cabecera">
          <h4 className="firma__titulo">Firma</h4>
          <p className="firma__descripcion">Adjunte la imagen de la firma rubricada.</p>
        </div>
        <FirmaUpload
          nombre={ruta(base, 'firma') as CampoFirma}
          control={control}
          descripcion={descripcion}
          error={errorDe(`${base}.firma`) ?? errorDe(`${base}.firma.dataUrl`)}
        />
      </div>
    </fieldset>
  )
}