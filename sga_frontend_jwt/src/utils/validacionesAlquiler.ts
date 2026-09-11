import type { Cliente } from '../interfaces/Cliente'
import type { DetalleProducto } from '../interfaces/DetalleProducto'

interface DatosValidacionAlquiler {
  cliente: Cliente
  detallesProducto: DetalleProducto[]
  tiempoAlquilerDias: number
  deposito: number
}

export function validarAlquiler({
  cliente,
  detallesProducto,
  tiempoAlquilerDias,
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

  if (!tiempoAlquilerDias || tiempoAlquilerDias < 1) {
    return 'El tiempo de alquiler (en días) debe ser mayor a 0.'
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

  // Espeja idx_unico_producto_alquiler del backend: ese índice único solo
  // exige que un producto NO EXTRA aparezca una sola vez por alquiler
  // (las líneas extra quedan exentas). Se valida aquí para dar un mensaje
  // claro antes de que el backend rechace el INSERT.
  const contadorNoExtra = new Map<number, number>()

  for (const detalle of detallesProducto) {
    if (detalle.esExtra || detalle.productoId === null) continue

    const total = (contadorNoExtra.get(detalle.productoId) ?? 0) + 1
    contadorNoExtra.set(detalle.productoId, total)

    if (total > 1) {
      return 'Un mismo producto no puede repetirse como línea normal. Si necesitas otra unidad del mismo producto, márcala como "producto extra".'
    }
  }

  return null
}
