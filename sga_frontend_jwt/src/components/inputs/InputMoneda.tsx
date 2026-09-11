import { forwardRef } from 'react'

interface InputMonedaProps {
  value: number
  onChange: (valor: number) => void
}

const formatearMoneda = (valor: number) => {
  return `$${valor.toLocaleString('es-CO')}`
}

const obtenerNumero = (valor: string) => {
  const numero = Number(valor.replace(/\D/g, ''))

  return Number.isNaN(numero) ? 0 : numero
}

// AJUSTADO: usaba <Input> de Chakra UI. Ahora es un <input> nativo con la
// clase .input (ver src/styles/components.css) — mismo comportamiento
// (formatea como moneda COP mientras se escribe), sin depender de Chakra.
export const InputMoneda = forwardRef<
  HTMLInputElement,
  InputMonedaProps
>(({ value, onChange }, ref) => {
  return (
    <input
      ref={ref}
      className="input"
      type="text"
      inputMode="numeric"
      value={formatearMoneda(value)}
      onChange={(e) => {
        const nuevoValor = obtenerNumero(e.target.value)

        onChange(nuevoValor)
      }}
    />
  )
})
