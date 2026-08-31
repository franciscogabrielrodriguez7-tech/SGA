import type { Cliente } from '../interfaces/Cliente'
import type { DetalleProducto } from '../interfaces/DetalleProducto'

interface DatosValidacionAlquiler {
  cliente: Cliente
  detallesProducto: DetalleProducto[]
  tiempoAlquiler: number
  deposito: number
}

export function validarAlquiler({
  cliente,
  detallesProducto,
  tiempoAlquiler,
  deposito,
}: DatosValidacionAlquiler): string | null {
  if (!cliente.id_usuario) {
    return 'Debe ingresar el número de documento del cliente.'
  }

  if (!cliente.nombres_usuario) {
    return 'Debe ingresar los nombres del cliente.'
  }

  if (!cliente.apellidos_usuario) {
    return 'Debe ingresar los apellidos del cliente.'
  }

  if (!cliente.telefono_usuario) {
    return 'Debe ingresar el teléfono del cliente.'
  }

  if (!tiempoAlquiler || tiempoAlquiler < 1) {
    return 'El tiempo de alquiler debe ser mayor a 0.'
  }

  if (deposito < 0) {
    return 'El depósito no puede ser negativo.'
  }

  if (detallesProducto.length === 0) {
    return 'Debe haber al menos un producto.'
  }

  const productoIncompleto = detallesProducto.some(
    (detalle) =>
      detalle.productoId === null ||
      detalle.cantidad < 1,
  )

  if (productoIncompleto) {
    return 'Todos los productos deben tener un producto seleccionado y una cantidad válida.'
  }

  return null
}