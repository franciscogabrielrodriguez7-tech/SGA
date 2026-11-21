/**
 * Interfaz del servicio de historial de operaciones — SGA Móvil (§3.5 / HU-11)
 */

import type { RegistroHistorial } from '../types/historial';
import type { Resultado } from '../types/models';

export interface HistorialService {
  /**
   * Lista el historial unificado de operaciones propias (entregas, recogidas y gastos)
   * del encargado logístico autenticado, en orden cronológico descendente.
   */
  listarPropio(
    id_usuario: string,
    responsable_nombre: string
  ): Promise<Resultado<RegistroHistorial[]>>;
}
