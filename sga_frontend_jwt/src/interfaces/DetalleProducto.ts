export interface DetalleProducto {
  productoId: number | null
  cantidad: number
  // Corresponde a detalle_alquiler.es_producto_extra en el backend.
  // El índice único idx_unico_producto_alquiler solo exige que un
  // producto NO EXTRA aparezca una sola vez por alquiler; las líneas
  // marcadas como extra quedan exentas, por lo que un mismo producto
  // puede tener una línea normal y una (o más) líneas extra a la vez.
  esExtra: boolean
}