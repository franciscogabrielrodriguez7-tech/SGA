// RN de precio (única fuente de verdad, reutilizada por CrearAlquiler y
// por la renovación en AlquilerDetalle): producto.precio_base_producto
// se interpreta SIEMPRE "por" su propia unidad_minima_alquiler. Por eso
// nunca se divide entre 7 para prorratear a un valor diario: se
// multiplica por el número ENTERO de esas unidades que caben en la
// duración en días. Quien llama debe garantizar (restricción de UI +
// validación real del backend) que esa duración sea múltiplo del
// tamaño de la unidad del producto, para que la división no deje
// fracción.
import { unidadesDeProducto } from "./tiempoUi";
import type { UnidadMinimaAlquiler } from "../interfaces/Producto";

export function calcularPrecioConjunto(
  precioBaseProducto: number,
  unidadMinimaAlquiler: UnidadMinimaAlquiler,
  cantidad: number,
  duracionEnDias: number,
): number {
  const unidades = unidadesDeProducto(duracionEnDias, unidadMinimaAlquiler);
  return precioBaseProducto * cantidad * unidades;
}
