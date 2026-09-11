// Utilidad de UI para capturar la duración del alquiler en la unidad
// que el usuario prefiera (días, semanas o meses) y convertirla a la
// única unidad que el backend persiste: tiempo_alquiler_dias (entero,
// días). El backend NO tiene concepto de "semana" o "mes" como columna
// -- ver app/schemas/alquiler_schema.py y app/utils/tiempo.py -- así
// que esta conversión ocurre aquí antes de armar el payload.
//
// Además espeja la jerarquía DIA < SEMANA < MES de
// producto.unidad_minima_alquiler (ver app/utils/unidades.py del
// backend): un producto solo puede alquilarse en su unidad mínima o
// una superior. Esto es SOLO para restringir la UI y evitar viajes
// redondos al servidor; la validación real y definitiva la hace el
// backend en crear_alquiler (valida de nuevo contra la BD).
import type { UnidadMinimaAlquiler } from "../interfaces/Producto";

export type UnidadTiempo = "dias" | "semanas" | "meses";

export const OPCIONES_UNIDAD_TIEMPO: { valor: UnidadTiempo; etiqueta: string }[] = [
  { valor: "dias", etiqueta: "Días" },
  { valor: "semanas", etiqueta: "Semanas" },
  { valor: "meses", etiqueta: "Meses" },
];

// Convención comercial del sistema (igual que app/utils/unidades.py):
// 1 semana = 7 días, 1 mes = 30 días (no el mes calendario real). Si
// el negocio usa otro criterio para "mes", se ajusta en un solo lugar
// (y su espejo en el backend).
const FACTORES_A_DIAS: Record<UnidadTiempo, number> = {
  dias: 1,
  semanas: 7,
  meses: 30,
};

// Mapea la unidad mínima del producto (backend) a la unidad de tiempo
// de UI equivalente, para comparar jerarquías con el mismo vocabulario.
const UNIDAD_MINIMA_A_UNIDAD_TIEMPO: Record<UnidadMinimaAlquiler, UnidadTiempo> = {
  DIA: "dias",
  SEMANA: "semanas",
  MES: "meses",
};

const ORDEN_UNIDAD_TIEMPO: Record<UnidadTiempo, number> = {
  dias: 0,
  semanas: 1,
  meses: 2,
};

export function convertirADias(cantidad: number, unidad: UnidadTiempo): number {
  if (!cantidad || cantidad < 1) return 0;
  return Math.round(cantidad * FACTORES_A_DIAS[unidad]);
}

export function diasASemanas(dias: number): number {
  return dias / 7;
}

// Cuántas unidades "propias" de un producto corresponden a una
// duración total en días. Ej.: producto SEMANA + 14 días -> 2. El
// llamador debe garantizar que tiempoAlquilerDias sea múltiplo del
// tamaño de esa unidad (ver unidadMinimaPermiteUnidadTiempo /
// unidadTiempoMasRestrictiva): si no lo es, esto trunca, así que no
// debe usarse para habilitar combinaciones inválidas.
export function unidadesDeProducto(
  tiempoAlquilerDias: number,
  unidadMinima: UnidadMinimaAlquiler,
): number {
  return tiempoAlquilerDias / FACTORES_A_DIAS[UNIDAD_MINIMA_A_UNIDAD_TIEMPO[unidadMinima]];
}

// ¿La unidad de tiempo elegida por el usuario es >= la unidad mínima
// del producto? (jerarquía DIA < SEMANA < MES).
export function unidadMinimaPermiteUnidadTiempo(
  unidadMinima: UnidadMinimaAlquiler,
  unidad: UnidadTiempo,
): boolean {
  return ORDEN_UNIDAD_TIEMPO[unidad] >= ORDEN_UNIDAD_TIEMPO[UNIDAD_MINIMA_A_UNIDAD_TIEMPO[unidadMinima]];
}

// De todas las unidades mínimas de los productos en el carrito,
// retorna la más restrictiva expresada como UnidadTiempo (para
// deshabilitar opciones de la UI). Sin productos -> "dias" (sin
// restricción).
export function unidadTiempoMasRestrictiva(
  unidadesMinimas: UnidadMinimaAlquiler[],
): UnidadTiempo {
  if (unidadesMinimas.length === 0) return "dias";

  return unidadesMinimas.reduce<UnidadTiempo>((masRestrictiva, unidadMinima) => {
    const candidata = UNIDAD_MINIMA_A_UNIDAD_TIEMPO[unidadMinima];
    return ORDEN_UNIDAD_TIEMPO[candidata] > ORDEN_UNIDAD_TIEMPO[masRestrictiva]
      ? candidata
      : masRestrictiva;
  }, "dias");
}
