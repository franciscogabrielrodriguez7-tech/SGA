import type { AlquilerUpdatePayload, EstadoAlquiler } from "../interfaces/Alquiler";
import type { UnidadTiempo } from "./tiempoUi";

// ============================================================================
// reglasAlquiler.ts — espejo de las reglas por estado del backend
// ----------------------------------------------------------------------------
// Igual que permisos.ts: el frontend NO decide, solo oculta/deshabilita lo
// que el backend rechazaría de todas formas. Fuentes de verdad:
//   * CAMPOS_EDITABLES_POR_ESTADO  -> alquiler_controller.py
//   * ESTADOS_DETALLE_EDITABLE     -> detalle_alquiler_controller.py
//   * renovar_alquiler / registrar_entrega / registrar_recogida
// Si cambian allá, deben cambiar aquí.
// ============================================================================

export type CampoEditableAlquiler = keyof AlquilerUpdatePayload;

export const CAMPOS_EDITABLES_POR_ESTADO: Record<EstadoAlquiler, CampoEditableAlquiler[]> = {
  pendiente: [
    "direccion",
    "barrio",
    "precio_alquiler",
    "deposito",
    "fecha_inicio",
    "tiempo_alquiler_dias",
    "se_lleva",
    "se_recoge",
  ],
  activo: ["precio_alquiler", "tiempo_alquiler_dias", "se_lleva", "se_recoge"],
  vencido: ["precio_alquiler", "tiempo_alquiler_dias"],
  recogido: [],
  terminado: [],
  cancelado: [],
};

export function puedeEditarAlquiler(estado: EstadoAlquiler): boolean {
  return CAMPOS_EDITABLES_POR_ESTADO[estado].length > 0;
}

export function puedeAgregarProductos(estado: EstadoAlquiler): boolean {
  return estado === "pendiente" || estado === "activo";
}

export function puedeRenovar(estado: EstadoAlquiler): boolean {
  return estado === "activo" || estado === "vencido";
}

export function puedeRegistrarEntrega(estado: EstadoAlquiler): boolean {
  return estado === "pendiente" || estado === "activo";
}

export function puedeRegistrarRecogida(estado: EstadoAlquiler): boolean {
  return estado === "activo" || estado === "vencido";
}

// Expresa una duración en días con la unidad más grande que la divida
// exactamente (1 mes = 30 días, 1 semana = 7, igual que tiempoUi.ts),
// sin bajar de la unidad mínima permitida por los productos.
export function descomponerDias(
  dias: number,
  unidadMinima: UnidadTiempo,
): { cantidad: number; unidad: UnidadTiempo } {
  const orden: UnidadTiempo[] = ["meses", "semanas", "dias"];
  const factor: Record<UnidadTiempo, number> = { dias: 1, semanas: 7, meses: 30 };
  const permitidas = orden.slice(0, orden.indexOf(unidadMinima) + 1);

  for (const unidad of permitidas) {
    if (dias % factor[unidad] === 0) {
      return { cantidad: dias / factor[unidad], unidad };
    }
  }

  return { cantidad: dias, unidad: "dias" };
}
