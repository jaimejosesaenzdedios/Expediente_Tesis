import { z } from 'zod'
import { esCarreraValida } from './carreras'
import { MAX_ESTUDIANTES } from './types'
import type { Informe } from './informe'

const RE_DNI = /^\d{8}$/
const RE_ORCID = /^(\d{4}-){3}\d{3}[\dX]$/
const RE_CORREO = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
const RE_CODIGO = /^[A-Za-z0-9][A-Za-z0-9-_/. ]*$/
const RE_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/

/**
 * El DNI peruano tiene 8 digitos. RENIEC calcula aparte un digito verificador
 * (modulo 11) que se imprime junto al numero, pero ese valor no forma parte de
 * los 8 digitos, asi que aca solo se valida el formato. Validar el digito contra
 * los propios 8 digitos rechazaria documentos legítimos.
 */
export function esDniValido(valor: string): boolean {
  return RE_DNI.test(valor)
}

export function esOrcidValido(valor: string): boolean {
  if (!RE_ORCID.test(valor)) return false
  const digitos = valor.replace(/-/g, '').split('').map((caracter) => (caracter === 'X' ? 10 : Number(caracter)))
  let total = 0
  for (const digito of digitos.slice(0, 15)) total = (total + digito) * 2
  const resultado = (12 - (total % 11)) % 11
  const verificador = resultado === 10 ? 10 : resultado
  return verificador === digitos[15]
}

export function normalizarDni(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 8)
}

export function normalizarOrcid(valor: string): string {
  const digitos = valor.replace(/[^0-9Xx]/g, '').toUpperCase().slice(0, 16)
  if (digitos.length <= 4) return digitos
  const bloques = [digitos.slice(0, 4), digitos.slice(4, 8), digitos.slice(8, 12), digitos.slice(12, 16)]
  return bloques.map((bloque, indice) => (indice < 3 ? bloque.padEnd(4, '0') : bloque)).join('-')
}

const esquemaFirma = z
  .object({
    nombreArchivo: z.string(),
    tipoMime: z.string(),
    bytes: z.number().int().nonnegative(),
    anchoPx: z.number().int().nonnegative(),
    altoPx: z.number().int().nonnegative(),
    dataUrl: z.string(),
  })
  .refine((firma) => firma.dataUrl.startsWith('data:image/'), {
    message: 'Adjunta la imagen de la firma (PNG, JPG o WEBP)',
    path: ['dataUrl'],
  })

export const esquemaPersona = z.object({
  codigo: z
    .string()
    .trim()
    .min(3, 'Ingresa el código (mínimo 3 caracteres)')
    .max(20, 'El código no puede superar 20 caracteres')
    .regex(RE_CODIGO, 'El código solo admite letras, números, guion o guion bajo'),
  nombres: z
    .string()
    .trim()
    .min(2, 'Ingresa los nombres')
    .max(60, 'Los nombres no pueden superar 60 caracteres')
    .regex(RE_NOMBRE, 'Los nombres solo admiten letras'),
  apellidos: z
    .string()
    .trim()
    .min(2, 'Ingresa los apellidos')
    .max(60, 'Los apellidos no pueden superar 60 caracteres')
    .regex(RE_NOMBRE, 'Los apellidos solo admiten letras'),
  dni: z
    .string()
    .transform(normalizarDni)
    .refine(esDniValido, 'El DNI debe tener 8 dígitos'),
  orcid: z
    .string()
    .transform(normalizarOrcid)
    .refine((valor) => RE_ORCID.test(valor), 'El ORCID debe tener el formato 0000-0000-0000-0000')
    .refine(esOrcidValido, 'El ORCID no es válido: el dígito verificador no coincide'),
  email: z
    .string()
    .trim()
    .min(1, 'Ingresa el correo electrónico')
    .max(80, 'El correo no puede superar 80 caracteres')
    .regex(RE_CORREO, 'Ingresa un correo electrónico válido'),
  firma: esquemaFirma,
})

const esquemaInforme = z
  .object({
    nombreArchivo: z.string(),
    tipoMime: z.string(),
    bytes: z.number().int().nonnegative(),
    dataUrl: z.string(),
  })
  .refine((informe) => informe.dataUrl.startsWith('data:application/pdf'), {
    message: 'El informe debe ser un archivo PDF',
    path: ['dataUrl'],
  })

export const esquemaExpediente = z
  .object({
    carrera: z.string().min(1, 'Seleccione la carrera').refine(esCarreraValida, 'Seleccione una carrera válida'),
    informe: esquemaInforme.optional(),
    tituloFinal: z
      .string()
      .trim()
      .min(10, 'Ingresa el título final de la tesis (mínimo 10 caracteres)')
      .max(200, 'El título no puede superar 200 caracteres'),
    asesor: esquemaPersona,
    estudiantes: z
      .array(esquemaPersona)
      .min(1, 'Registra al menos un estudiante')
      .max(MAX_ESTUDIANTES, `Se admiten máximo ${MAX_ESTUDIANTES} estudiantes por expediente`),
  })
  .superRefine((datos, ctx) => {
    const participantes = [
      { persona: datos.asesor, etiqueta: 'el asesor', campo: 'asesor' },
      ...datos.estudiantes.map((persona, indice) => ({
        persona,
        etiqueta: `el estudiante ${indice + 1}`,
        campo: `estudiantes.${indice}`,
      })),
    ]

    participantes.forEach(({ persona, campo }, indiceActual) => {
      participantes.forEach(({ persona: otra, etiqueta: etiquetaOtra }, indiceOtra) => {
        if (indiceActual === indiceOtra) return
        if (persona.dni === otra.dni) {
          ctx.addIssue({
            code: 'custom',
            path: [campo, 'dni'],
            message: `El DNI ya está registrado para ${etiquetaOtra}`,
          })
        }
        if (persona.orcid === otra.orcid) {
          ctx.addIssue({
            code: 'custom',
            path: [campo, 'orcid'],
            message: `El ORCID ya está registrado para ${etiquetaOtra}`,
          })
        }
      })
    })
  })

export type DatosExpediente = z.infer<typeof esquemaExpediente>

export type { Informe }