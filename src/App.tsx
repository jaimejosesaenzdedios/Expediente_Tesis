import { useState } from 'react'
import { ROLES, useSesion, type Rol } from './sesion/Sesion'
import { ExpedienteForm } from './features/ExpedienteForm'
import { ListaExpedientes } from './features/ListaExpedientes'
import { expedientesVisibles, puedeRegistrar } from './domain/permisos'
import { leerExpedientes } from './storage/expedientes'
import type { Expediente } from './domain/types'

function AccesoRestringido({ nombreSesion }: { nombreSesion: string }) {
  return (
    <section className="tarjeta tarjeta--bloqueo">
      <p className="tarjeta__antetitulo">Acceso denegado</p>
      <h2 className="tarjeta__titulo">Solo asesor y coordinador</h2>
      <p className="tarjeta__descripcion">
        El registro y la edición de expedientes de tesis está reservado al docente asesor y al coordinador del
        Programa de Titulación. Tu sesión actual es «{nombreSesion}».
      </p>
      <p className="campo__ayuda">
        Si crees que es un error, comunícate con la coordinación de la unidad académica.
      </p>
    </section>
  )
}

export default function App() {
  const { rol, cambiarRol, nombreSesion, usuario, cambiarUsuario } = useSesion()
  const esAsesor = rol === 'asesor'
  const [expedienteAEditar, setExpedienteAEditar] = useState<Expediente | null>(null)
  const [vista, setVista] = useState<'lista' | 'formulario'>(() =>
    leerExpedientes().length > 0 ? 'lista' : 'formulario',
  )

  const expedientes = expedientesVisibles(leerExpedientes(), rol, usuario)

  function editarExpediente(expediente: Expediente) {
    setExpedienteAEditar(expediente)
    setVista('formulario')
  }

  function cancelarEdicion() {
    setExpedienteAEditar(null)
    setVista('lista')
  }

  function nuevoExpediente() {
    setExpedienteAEditar(null)
    setVista('formulario')
  }

  return (
    <div className="app">
      <div className="institucion">
        <div className="institucion__contenido">
          <div className="institucion__identidad">
            <div>
              <p className="institucion__nombre">Universidad Tecnológica del Perú</p>
              <p className="institucion__facultad">Programa de Titulación (PT)</p>
            </div>
          </div>

          <div className="institucion__sesion">
            <div className="sesion">
              <span className="sesion__etiqueta">Sesión activa</span>
              <span className="sesion__valor">{nombreSesion}</span>
            </div>
            <label className="conmutador">
              <span className="conmutador__texto">Usuario</span>
              <input
                className="conmutador__input"
                value={usuario}
                onChange={(evento) => cambiarUsuario(evento.target.value)}
                placeholder="Código docente"
              />
            </label>
            <label className="conmutador">
              <span className="conmutador__texto">Vista como</span>
              <select
                className="conmutador__select"
                value={rol}
                onChange={(evento) => cambiarRol(evento.target.value as Rol)}
              >
                {ROLES.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion === 'asesor' ? 'Asesor' : opcion === 'coordinador' ? 'Coordinador de PT' : 'Estudiante'}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <header className="encabezado">
        <div className="encabezado__texto">
          <p className="encabezado__antetitulo">Programa de Titulación · Formulario EXP-01</p>
          <h1 className="encabezado__titulo">Registro de expediente de tesis</h1>
          <p className="encabezado__descripcion">
            Complete los datos del asesor, de hasta dos estudiantes asesorados y el título final de la tesis. Todos
            los campos son obligatorios.
          </p>
        </div>
        <span className={puedeRegistrar(rol) ? 'distintivo distintivo--activo' : 'distintivo'}>
          {puedeRegistrar(rol) ? 'Habilitado para registro' : 'Solo lectura'}
        </span>
      </header>

      <main className="contenido">
        {puedeRegistrar(rol) ? (
          vista === 'lista' ? (
            <ListaExpedientes
              expedientes={expedientes}
              alEditar={editarExpediente}
              alNuevo={nuevoExpediente}
              soloPropios={esAsesor}
              usuario={usuario}
            />
          ) : (
            <ExpedienteForm
              expedienteInicial={expedienteAEditar}
              alCancelarEdicion={cancelarEdicion}
            />
          )
        ) : (
          <AccesoRestringido nombreSesion={nombreSesion} />
        )}
      </main>

      <footer className="pie">
        <p className="pie__texto">
          Universidad Tecnológica del Perú · Programa de Titulación (PT) · Formulario EXP-01 · Los datos se
          almacenan localmente en este equipo.
        </p>
      </footer>
    </div>
  )
}