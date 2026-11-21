/**
 * Tipos del dominio de gastos — SGA Móvil
 *
 * Cumple RNM-09, RNM-10, RNM-11 y RNM-12:
 * - Valor global positivo (> 0). No se multiplica ni distribuye entre asociaciones.
 * - Descripción obligatoria.
 * - Asociación con uno o varios alquileres.
 * - Tipo de movimiento por asociación: 'entrega' | 'recogida'.
 * - Un mismo alquiler puede repetirse únicamente si el tipo de movimiento es diferente.
 * - No se permite editar ni eliminar gastos desde la aplicación móvil.
 */

import type { OrigenDatos } from './models';

/** Tipo de movimiento por asociación gasto-alquiler (RNM-10) */
export type TipoMovimientoAsociacion = 'entrega' | 'recogida';

/** Alias de compatibilidad */
export type TipoMovimiento = TipoMovimientoAsociacion;

/** Asociación de un gasto a un alquiler con su tipo de movimiento */
export interface AsociacionGasto {
  id_alquiler: number;
  tipo_movimiento: TipoMovimientoAsociacion;
}

/** Estado de sincronización de un gasto */
export type EstadoSincronizacionGasto = 'confirmada' | 'pendiente' | 'enviando' | 'error';

/** Gasto logístico del encargado logístico */
export interface GastoLogistico {
  id: string;
  id_usuario: string;
  responsable_nombre: string;
  descripcion: string;
  /** Valor total positivo (RNM-09) — NO se multiplica ni distribuye por asociaciones */
  valor: number;
  /** ISO 8601 con fecha y hora automáticas */
  fecha: string;
  /** Estado de sincronización */
  estado: EstadoSincronizacionGasto;
  /** Origen del registro (simulado / local / servidor) */
  origen: OrigenDatos;
  /** Al menos una asociación requerida (RNM-09, RNM-10, RNM-11) */
  asociaciones: AsociacionGasto[];
  /** ID de la operación en la cola local si aún no está confirmada */
  id_operacion_cola?: string;
  ultimoError?: string;
}

/** Alias de compatibilidad para los datos mock */
export type GastoSimulado = GastoLogistico;

/** Borrador para validar antes de registrar un gasto */
export interface BorradorGasto {
  valorTexto: string;
  descripcion: string;
  asociaciones: AsociacionGasto[];
}

/** Filtros para la consulta de gastos propios (§3.4) */
export interface FiltrosGastos {
  /** Fecha en formato YYYY-MM-DD */
  dia?: string;
  /** Búsqueda por descripción */
  descripcion?: string;
  /** Filtro por valor mínimo */
  valorMin?: number;
  /** Filtro por valor máximo */
  valorMax?: number;
}

/** Opción de cálculo de promedio en el resumen semanal (§3.4) */
export type ModoPromedioGasto = 'diario' | 'semanal';

/** Resumen semanal de gastos de lunes a domingo (§3.4 / HU-10) */
export interface ResumenSemanalGastos {
  /** Fecha del lunes YYYY-MM-DD */
  semana_inicio: string;
  /** Fecha del domingo YYYY-MM-DD */
  semana_fin: string;
  /** Desplazamiento respecto a la semana actual (0 = actual, -1 = anterior, etc.) */
  desplazamiento_semanas: number;
  /** Total gastado en la semana (confirmados + pendientes locales) */
  total: number;
  /** Total de gastos ya confirmados por el servidor (o simulados confirmados) */
  total_confirmado: number;
  /** Total de gastos pendientes localmente */
  total_pendiente_local: number;
  /** Promedio diario de la semana seleccionada (total / 7 días) */
  promedio_diario: number;
  /** Promedio semanal calculado sobre las semanas consultables */
  promedio_semanal: number;
  cantidad_gastos: number;
  cantidad_confirmados: number;
  cantidad_pendientes_locales: number;
  gastos: GastoLogistico[];
}

export type ResumenSemanal = ResumenSemanalGastos;
