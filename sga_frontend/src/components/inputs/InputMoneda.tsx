import { forwardRef } from 'react'
import { Input } from '@chakra-ui/react'

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

export const InputMoneda = forwardRef<
  HTMLInputElement,
  InputMonedaProps
>(({ value, onChange }, ref) => {
  return (
    <Input
      ref={ref}
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