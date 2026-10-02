import type { ReactNode } from 'react'

type PropsCampo = {
  id: string
  etiqueta: string
  requerido?: boolean
  ayuda?: string
  error?: string
  children: ReactNode
}

export function Campo({ id, etiqueta, requerido, ayuda, error, children }: PropsCampo) {
  return (
    <div className={error ? 'campo campo--error' : 'campo'}>
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
        {requerido ? <span className="campo__obligatorio"> *</span> : null}
      </label>
      {children}
      <p className={error ? 'campo__ayuda campo__ayuda--error' : 'campo__ayuda'} role={error ? 'alert' : undefined}>
        {error ?? ayuda ?? ' '}
      </p>
    </div>
  )
}