/**
 * Tipos de la cola de operaciones pendientes — SGA Móvil
 * Las operaciones quedan vinculadas al id_usuario que las creó.
 */

import type { AsociacionGasto, TipoMovimientoAsociacion } from './gastos';

/** Tipos de operación que pueden encolarse */
export type TipoOperacion = 'entrega' | 'recogida' | 'gasto';

/** Estado del ciclo de vida de una operación en cola */
export type EstadoOperacion =
  | 'pendiente'    // Creada localmente, aún no enviada al servidor
  | 'enviando'     // En proceso de sincronización
  | 'confirmada'   // Aceptada por el servidor (o simulada como confirmada)
  | 'error';       // Falló después de los 3 reintentos automáticos (RNM-17)

/** Payload de una operación de entrega */
export interface PayloadEntrega {
  id_alquiler: number;
  observaciones?: string;
  responsable_nombre?: string;
}

/** Payload de una operación de recogida */
export interface PayloadRecogida {
  id_alquiler: number;
  observaciones?: string;
  responsable_nombre?: string;
}

/** Asociación de un gasto a un alquiler (tipo_movimiento: 'entrega' | 'recogida') */
export interface AsociacionAlquiler extends AsociacionGasto {
  id_alquiler: number;
  tipo_movimiento: TipoMovimientoAsociacion;
}

/** Payload de un gasto logístico */
export interface PayloadGasto {
  descripcion: string;
  /** Valor total del gasto — debe ser estrictamente positivo (RNM-09) */
  valor: number;
  /** ISO 8601 automático */
  fecha: string;
  /** Al menos una asociación requerida con tipo 'entrega' o 'recogida' (RNM-10/11) */
  asociaciones: AsociacionAlquiler[];
  responsable_nombre?: string;
}

/** Operación pendiente de sincronización */
export interface OperacionPendiente<T = PayloadEntrega | PayloadRecogida | PayloadGasto> {
  /** Identificador único generado localmente */
  id: string;
  tipo: TipoOperacion;
  /** ID del alquiler principal (o primer alquiler asociado en caso de gasto) */
  id_alquiler: number;
  /** Usuario que creó la operación — clave de aislamiento */
  id_usuario: string;
  payload: T;
  /** ISO 8601 automático */
  creadaEn: string;
  estado: EstadoOperacion;
  /** Número de intentos de sincronización realizados */
  intentos: number;
  ultimoError?: string;
}
