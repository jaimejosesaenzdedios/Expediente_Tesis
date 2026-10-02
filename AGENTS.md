# AGENTS.md

Formulario de registro de expedientes de tesis del Programa de Titulación (PT) de la UTP. React + TypeScript + Vite, sin backend.

## Entorno y versiones

- **Node 20.16.0**. Vite está fijado a `^6` a propósito: Vite 8 exige Node `^20.19.0` y el build falla con el binario de rolldown. No subir Vite sin subir Node.
- TypeScript `~5.7` (no 6.x). `tsconfig` tiene `verbatimModuleSyntax: true` → usar `import type` para tipos. `noUnusedLocals` y `noUnusedParameters` están activos.

## Comandos

```bash
npm run dev        # servidor de desarrollo
npm run build      # tsc -b && vite build
npm run lint       # oxlint
npm run typecheck  # tsc -b --noEmit
npm test           # vitest run
```

Orden de verificación: `lint` → `typecheck` → `test` → `build`. Correr un solo test: `npx vitest run tests/validations.test.ts`.

## Arquitectura

- `src/domain/` — tipos, validaciones (zod), catálogo de carreras, permisos por rol.
- `src/features/` — `ExpedienteForm`, `ListaExpedientes`, `ResumenExpediente`.
- `src/components/` — UI reutilizable (`Campo`, `CamposPersona`, `FirmaUpload`, `InformeUpload`).
- `src/sesion/` — sesión y roles. `src/storage/` — persistencia en localStorage. `src/utils/` — generación de `.docx`, procesado de firmas, errores.

## Persistencia

Todo se guarda en `localStorage` (clave `expedientes.tesis.v1`). No hay backend. Los datos y las firmas (en base64) viven en el navegador; con PDFs grandes se puede agotar la cuota (~5 MB). Para producción hace falta backend y almacenamiento de archivos.

## Roles

`asesor` (solo sus registros), `coordinador` (todos), `estudiante` (sin acceso). La sesión se simula con el selector "Vista como" y el campo "Usuario" en la cabecera; el filtrado está en `src/domain/permisos.ts`. No es seguridad real: el usuario se escribe a mano.

## Validaciones

- **DNI**: solo formato de 8 dígitos. El dígito verificador de RENIEC es un valor aparte impreso junto al número, no forma parte de los 8 dígitos — validarlo contra el número rechaza DNIs legítimos.
- **ORCID**: formato `0000-0000-0000-0000` y dígito verificador ISO 7064 (MOD 11-2). Se autocompleta con guiones.
- zod v4 con `@hookform/resolvers` v5.

## Generación del ANEXO 18 (.docx)

`src/utils/declaracion.ts` manipula la plantilla con JSZip. Puntos críticos:

- La plantilla fuente es `plantillas/ANEXO 18- DJ Asesor.docx`; la copia que sirve el navegador está en `public/plantillas/`. **Al editar la plantilla, copiarla a `public/plantillas/`.**
- Los placeholders están en *content controls* (SDT) de Word, a veces partidos en varios runs. Se reemplaza cada SDT completo buscando su texto concatenado normalizado (`reemplazarSDTs`), no por búsqueda de texto suelto.
- La imagen de la firma en `wp:inline` **debe** llevar `wp14:anchorId` y `wp14:editId`; sin ellos Word muestra "contenido ilegible" aunque el XML esté bien formado.

## Pruebas

- vitest corre en Node, sin `localStorage`. Las pruebas de storage lo mockean con `vi.stubGlobal`.
- Las pruebas de `.docx` leen la plantilla con `new URL('../public/plantillas/ANEXO 18- DJ Asesor.docx', import.meta.url)` (una sola `../`: `tests/` → raíz del proyecto).
