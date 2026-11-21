/**
 * Adaptador simulado del servicio de historial — SGA Móvil (§3.5 / HU-11)
 *
 * Unifica entregas, recogidas y gastos propios del encargado logístico
 * autenticado, incluyendo operaciones locales aún no confirmadas en la cola.
 */

import { obtenerEscenario } from '../../data/mock/escenario.ts';
import { unificarHistorialUsuario } from '../../domain/historial.ts';
import { obtenerNoConfirmadas } from '../../storage/cola.ts';
import type { HistorialService } from '../HistorialService.ts';
import {
  obtenerAlquileresSimulados,
  obtenerGastosSimulados,
  obtenerOperacionesConfirmadasSimuladas,
} from './estadoSimulado.ts';

const espera = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const historialServiceMock: HistorialService = {
  async listarPropio(id_usuario, responsable_nombre) {
    await espera(200);
    const escenario = obtenerEscenario();
    if (escenario === 'error') {
      throw new Error('Error de conexión simulado al consultar el historial.');
    }

    const colaUsuario = await obtenerNoConfirmadas(id_usuario);
    const operacionesConfirmadas =
      escenario === 'vacio' ? [] : obtenerOperacionesConfirmadasSimuladas();
    const gastosUsuario =
      escenario === 'vacio' ? [] : obtenerGastosSimulados();
    const alquileres = obtenerAlquileresSimulados();

    const registros = unificarHistorialUsuario({
      id_usuario,
      responsable_nombre,
      operacionesConfirmadas,
      gastosUsuario,
      colaUsuario,
      alquileres,
    });

    return {
      datos: registros,
      origen: colaUsuario.length > 0 ? 'local' : 'simulado',
      actualizadoEn: new Date().toISOString(),
    };
  },
};
