/**
 * Adaptador simulado del servicio de gastos — SGA Móvil (§3.3 y §3.4)
 *
 * Une los gastos confirmados en el estado simulado con los gastos pendientes
 * o con error en la cola local del usuario autenticado.
 * Nunca presenta un gasto local pendiente como confirmado por el servidor (RNM-14).
 */

import { obtenerEscenario } from '../../data/mock/escenario.ts';
import {
  calcularResumenSemanalGastos,
  filtrarGastosPropios,
} from '../../domain/gastos.ts';
import { encolar, obtenerNoConfirmadas } from '../../storage/cola.ts';
import type { GastoLogistico } from '../../types/gastos.ts';
import type { PayloadGasto } from '../../types/queue.ts';
import type { GastosService } from '../GastosService.ts';
import { obtenerGastosSimulados } from './estadoSimulado.ts';
import { obtenerEscenarioSync, sincronizarPendientes } from './syncServiceMock.ts';

const espera = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function construirGastosUsuario(id_usuario: string): Promise<GastoLogistico[]> {
  const baseSimulada =
    obtenerEscenario() === 'vacio' ? [] : obtenerGastosSimulados();
  const propiosBase = baseSimulada.filter((g) => g.id_usuario === id_usuario);

  const colaNoConfirmada = await obtenerNoConfirmadas<PayloadGasto>(id_usuario);
  const gastosEnCola: GastoLogistico[] = colaNoConfirmada
    .filter((op) => op.tipo === 'gasto')
    .map((op) => ({
      id: op.id,
      id_operacion_cola: op.id,
      id_usuario: op.id_usuario,
      responsable_nombre: op.payload.responsable_nombre || 'Carlos Mendoza',
      descripcion: op.payload.descripcion,
      valor: op.payload.valor,
      fecha: op.payload.fecha || op.creadaEn,
      estado: op.estado,
      origen: 'local',
      asociaciones: op.payload.asociaciones,
      ultimoError: op.ultimoError,
    }));

  // Evitar duplicados si algún gasto de la cola ya está en base
  const idsCola = new Set(gastosEnCola.map((g) => g.id));
  const combinados = [
    ...gastosEnCola,
    ...propiosBase.filter((g) => !idsCola.has(g.id)),
  ];

  return filtrarGastosPropios(combinados, id_usuario);
}

export const gastosServiceMock: GastosService = {
  async listarPropios(id_usuario) {
    await espera(200);
    if (obtenerEscenario() === 'error') {
      throw new Error('Error de conexión simulado al consultar gastos.');
    }
    const datos = await construirGastosUsuario(id_usuario);
    return {
      datos,
      origen: 'simulado',
      actualizadoEn: new Date().toISOString(),
    };
  },

  async obtenerResumenSemanal(
    id_usuario,
    fechaReferenciaISO,
    desplazamientoSemanas = 0
  ) {
    await espera(180);
    if (obtenerEscenario() === 'error') {
      throw new Error('Error de conexión simulado al consultar el resumen semanal.');
    }
    const todos = await construirGastosUsuario(id_usuario);
    const resumen = calcularResumenSemanalGastos(
      todos,
      id_usuario,
      fechaReferenciaISO,
      desplazamientoSemanas
    );
    return {
      datos: resumen,
      origen: 'simulado',
      actualizadoEn: new Date().toISOString(),
    };
  },

  async registrar(params) {
    const fechaISO = new Date().toISOString();
    const payload: PayloadGasto = {
      descripcion: params.descripcion,
      valor: params.valor,
      fecha: fechaISO,
      asociaciones: params.asociaciones,
      responsable_nombre: params.responsable_nombre,
    };

    const op = await encolar<PayloadGasto>(params.id_usuario, {
      tipo: 'gasto',
      id_alquiler: params.asociaciones[0]?.id_alquiler ?? 0,
      payload,
    });

    const hayConexionEfectiva =
      params.conectado && obtenerEscenarioSync() !== 'sin_conexion';

    if (hayConexionEfectiva) {
      const res = await sincronizarPendientes(params.id_usuario);
      if (res.confirmadas > 0 && res.errores === 0) {
        return {
          gasto: {
            id: op.id,
            id_operacion_cola: op.id,
            id_usuario: params.id_usuario,
            responsable_nombre: params.responsable_nombre,
            descripcion: params.descripcion,
            valor: params.valor,
            fecha: fechaISO,
            estado: 'confirmada',
            origen: 'simulado',
            asociaciones: params.asociaciones,
          },
          sincronizadoInmediatamente: true,
        };
      }
    }

    return {
      gasto: {
        id: op.id,
        id_operacion_cola: op.id,
        id_usuario: params.id_usuario,
        responsable_nombre: params.responsable_nombre,
        descripcion: params.descripcion,
        valor: params.valor,
        fecha: fechaISO,
        estado: 'pendiente',
        origen: 'local',
        asociaciones: params.asociaciones,
      },
      sincronizadoInmediatamente: false,
    };
  },
};
