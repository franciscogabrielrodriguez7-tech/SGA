/**
 * Interfaz del servicio de gastos — SGA Móvil (§3.3 y §3.4)
 *
 * No incluye métodos de edición ni eliminación (RNM-12 / RN-MOV-10 / RN-MOV-26).
 */

import type {
  AsociacionGasto,
  GastoLogistico,
  ResumenSemanalGastos,
} from '../types/gastos';
import type { Resultado } from '../types/models';

export interface GastosService {
  /**
   * Lista todos los gastos propios del encargado logístico autenticado
   * (incluyendo los confirmados y los pendientes en la cola local).
   */
  listarPropios(id_usuario: string): Promise<Resultado<GastoLogistico[]>>;

  /**
   * Obtiene el resumen semanal de lunes a domingo para el usuario autenticado,
   * permitiendo consultar la semana actual (desplazamiento = 0) y semanas anteriores (< 0).
   * DEP-MOV-01: en el backend actual GET /gastos/resumen-semanal está restringido a ADMIN_O_FACTURACION.
   */
  obtenerResumenSemanal(
    id_usuario: string,
    fechaReferenciaISO: string,
    desplazamientoSemanas?: number
  ): Promise<Resultado<ResumenSemanalGastos>>;

  /**
   * Registra un nuevo gasto logístico.
   * - Si hay conexión, intenta sincronizarlo.
   * - Si no hay conexión (o falla el servidor), queda almacenado en la cola local
   *   como pendiente de sincronización.
   */
  registrar(params: {
    id_usuario: string;
    responsable_nombre: string;
    valor: number;
    descripcion: string;
    asociaciones: AsociacionGasto[];
    conectado: boolean;
  }): Promise<{
    gasto: GastoLogistico;
    sincronizadoInmediatamente: boolean;
  }>;
}
