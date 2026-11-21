/**
 * Tipos del dominio de historial de operaciones — SGA Móvil (§3.5 / HU-11)
 *
 * Incluye entregas, recogidas y gastos del encargado logístico autenticado,
 * combinando operaciones confirmadas y operaciones locales en cola pendientes
 * o con error (nunca presentadas como confirmadas).
 */

import type { OrigenDatos } from './models';
import type { TipoMovimientoAsociacion } from './gastos';

export type TipoOperacionHistorial = 'entrega' | 'recogida' | 'gasto';

export type EstadoSincronizacionHistorial =
  | 'confirmada'
  | 'pendiente'
  | 'enviando'
  | 'error';

export interface ReferenciaAlquilerHistorial {
  id_alquiler: number;
  cliente_nombre: string;
  direccion: string;
  barrio: string;
  /** Presente en gastos para indicar si la asociación fue por entrega o recogida */
  tipo_movimiento?: TipoMovimientoAsociacion;
}

export interface RegistroHistorial {
  id: string;
  tipo: TipoOperacionHistorial;
  /** ISO 8601 completo (fecha y hora) */
  fecha: string;
  id_usuario: string;
  responsable_nombre: string;
  id_alquiler_principal: number;
  alquileres_relacionados: ReferenciaAlquilerHistorial[];
  /** Valor monetario total cuando corresponde (solo para gastos) */
  valor?: number;
  /** Observaciones (en entregas/recogidas) o descripción (en gastos) */
  detalle_texto: string;
  estado_sincronizacion: EstadoSincronizacionHistorial;
  /** True cuando el registro está aún en la cola local sin confirmación del servidor */
  es_local_no_confirmado: boolean;
  origen: OrigenDatos;
  intentos?: number;
  ultimoError?: string;
}

export interface FiltrosHistorial {
  /** Texto libre para buscar por ID, cliente, descripción/observaciones o tipo */
  busqueda?: string;
  /** Filtro independiente por tipo de operación */
  tipo?: 'todos' | TipoOperacionHistorial;
  /** Filtro independiente por estado de sincronización */
  estado?: 'todos' | 'confirmados' | 'pendientes' | 'error';
  /** Filtro independiente por fecha YYYY-MM-DD */
  dia?: string;
}
