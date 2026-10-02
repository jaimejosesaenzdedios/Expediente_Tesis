import { describe, expect, it } from 'vitest'
import { esDniValido, esOrcidValido, normalizarDni, normalizarOrcid, esquemaExpediente } from '../src/domain/validations'
import { CARRERAS, tituloProfesionalDe } from '../src/domain/carreras'

describe('esDniValido', () => {
  it('acepta 8 digitos', () => {
    expect(esDniValido('70123456')).toBe(true)
    expect(esDniValido('45678912')).toBe(true)
  })

  it('rechaza longitud incorrecta o letras', () => {
    expect(esDniValido('7012345')).toBe(false)
    expect(esDniValido('701234567')).toBe(false)
    expect(esDniValido('7012345A')).toBe(false)
    expect(esDniValido('')).toBe(false)
  })
})

describe('normalizarDni', () => {
  it('deja solo digitos y recorta a 8', () => {
    expect(normalizarDni(' 70-123 456 ')).toBe('70123456')
    expect(normalizarDni('701234567890')).toBe('70123456')
  })
})

describe('esOrcidValido', () => {
  it('acepta el ORCID de ejemplo', () => {
    expect(esOrcidValido('0000-0002-1825-0097')).toBe(true)
  })

  it('rechaza digito verificador incorrecto', () => {
    expect(esOrcidValido('0000-0002-1825-0098')).toBe(false)
  })

  it('rechaza formato incompleto', () => {
    expect(esOrcidValido('0000-0002-1825-009')).toBe(false)
    expect(esOrcidValido('0000000218250097')).toBe(false)
  })
})

describe('normalizarOrcid', () => {
  it('inserta guiones y completa bloques', () => {
    expect(normalizarOrcid('0000000218250097')).toBe('0000-0002-1825-0097')
    expect(normalizarOrcid('0000-0002-1825-009x')).toBe('0000-0002-1825-009X')
    expect(normalizarOrcid('0000')).toBe('0000')
  })
})

const firmaValida = {
  nombreArchivo: 'firma.png',
  tipoMime: 'image/png',
  bytes: 1200,
  anchoPx: 300,
  altoPx: 90,
  dataUrl: 'data:image/png;base64,AAAA',
}

const personaValida = {
  codigo: 'A01234',
  nombres: 'María Elena',
  apellidos: 'Quispe Rojas',
  dni: '70123456',
  orcid: '0000-0002-1825-0097',
  email: 'mquispe@universidad.edu.pe',
  firma: firmaValida,
}

describe('esquemaExpediente', () => {
  const base = {
    carrera: 'Administración de Empresas',
    tituloFinal: 'Efecto del aprendizaje basado en proyectos en fifth graders',
    asesor: personaValida,
    estudiantes: [personaValida],
  }

  it('rechaza DNI u ORCID repetidos entre asesor y estudiante', () => {
    const resultado = esquemaExpediente.safeParse(base)
    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues.map((i) => i.path.join('.'))).toContain('estudiantes.0.dni')
    expect(resultado.error?.issues.map((i) => i.path.join('.'))).toContain('estudiantes.0.orcid')
  })

  it('acepta expediente con dos estudiantes distintos', () => {
    const resultado = esquemaExpediente.safeParse({
      ...base,
      estudiantes: [
        { ...personaValida, dni: '70123457', orcid: '0000-0002-1825-010X' },
        { ...personaValida, dni: '70123458', orcid: '0000-0002-1825-0118' },
      ],
    })
    expect(resultado.success).toBe(true)
  })

  it('rechaza mas de dos estudiantes', () => {
    const resultado = esquemaExpediente.safeParse({
      ...base,
      estudiantes: [
        { ...personaValida, dni: '70123457' },
        { ...personaValida, dni: '70123458' },
        { ...personaValida, dni: '70123459' },
      ],
    })
    expect(resultado.success).toBe(false)
  })

  it('exige firma en todas las personas', () => {
    const sinFirma = { ...personaValida, firma: { ...firmaValida, dataUrl: '' } }
    const resultado = esquemaExpediente.safeParse({ ...base, asesor: sinFirma })
    expect(resultado.success).toBe(false)
  })

  it('exige titulo final', () => {
    const resultado = esquemaExpediente.safeParse({ ...base, tituloFinal: '   ' })
    expect(resultado.success).toBe(false)
  })

  it('rechaza correo invalido', () => {
    const resultado = esquemaExpediente.safeParse({
      ...base,
      asesor: { ...personaValida, email: 'correo-malo' },
    })
    expect(resultado.success).toBe(false)
  })

  it('acepta informe PDF valido y rechaza otros formatos', () => {
    const conEstudianteDistinto = {
      ...base,
      estudiantes: [{ ...personaValida, dni: '70123457', orcid: '0000-0002-1825-010X' }],
    }
    const pdf = {
      nombreArchivo: 'informe.pdf',
      tipoMime: 'application/pdf',
      bytes: 2048,
      dataUrl: 'data:application/pdf;base64,JVBERi0=',
    }
    expect(esquemaExpediente.safeParse({ ...conEstudianteDistinto, informe: pdf }).success).toBe(true)
    expect(
      esquemaExpediente.safeParse({
        ...conEstudianteDistinto,
        informe: { ...pdf, dataUrl: 'data:image/png;base64,AAAA' },
      }).success,
    ).toBe(false)
    expect(esquemaExpediente.safeParse({ ...conEstudianteDistinto, informe: undefined }).success).toBe(true)
  })

  it('exige una carrera del catalogo', () => {
    const conEstudianteDistinto = {
      ...base,
      estudiantes: [{ ...personaValida, dni: '70123457', orcid: '0000-0002-1825-010X' }],
    }
    expect(esquemaExpediente.safeParse({ ...conEstudianteDistinto, carrera: '' }).success).toBe(false)
    expect(esquemaExpediente.safeParse({ ...conEstudianteDistinto, carrera: 'Astronomia' }).success).toBe(false)
    expect(esquemaExpediente.safeParse({ ...conEstudianteDistinto, carrera: 'Derecho' }).success).toBe(true)
  })
})

describe('tituloProfesionalDe', () => {
  it('devuelve el titulo profesional de cada carrera', () => {
    expect(tituloProfesionalDe('Administración de Empresas')).toBe(
      'Título profesional de Licenciado en Administración de Empresas',
    )
    expect(tituloProfesionalDe('Derecho')).toBe('Título profesional de Abogado')
    expect(tituloProfesionalDe('Contabilidad')).toBe('Título profesional de Contador público')
    expect(tituloProfesionalDe('Arquitectura')).toBe('Título profesional de Arquitecto')
    expect(tituloProfesionalDe('Ingeniería Civil')).toBe('Título profesional de Ingeniero Civil')
  })

  it('deviene vacio si la carrera no existe', () => {
    expect(tituloProfesionalDe('Carrera inexistente')).toBe('')
    expect(tituloProfesionalDe('')).toBe('')
  })

  it('cubre las diez carreras del catalogo', () => {
    expect(CARRERAS).toHaveLength(10)
    for (const opcion of CARRERAS) {
      expect(tituloProfesionalDe(opcion.carrera)).toBe(`Título profesional de ${opcion.titulo}`)
    }
  })
})