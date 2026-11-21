/**
 * Adaptador mock del servicio de sincronización — SGA Móvil (§3.1, §3.3, §3.5, §3.6)
 *
 * Cumple:
 * - RNM-14: Una operación local no se presenta como confirmada hasta que el
 *   servidor la acepta.
 * - RNM-16: El servidor es la autoridad para validar el estado del alquiler y
 *   confirmar entregas ('pendiente' -> 'activo') y recogidas ('activo'|'vencido' -> 'recogido').
 * - RNM-17: Hasta 3 intentos automáticos de sincronización antes de pasar a estado
 *   'error' para reintento manual.
 * - RNM-18: Prevención de duplicados antes de enviar.
 */

import { puedeRegistrarEntrega, puedeRegistrarRecogida } from '../../domain/alquileres.ts';
import {
  actualizarOperacion,
  limpiarConfirmadas,
  obtenerNoConfirmadas,
  yaConfirmada,
} from '../../storage/cola.ts';
import type {
  OperacionPendiente,
  PayloadEntrega,
  PayloadGasto,
  PayloadRecogida,
} from '../../types/queue.ts';
import {
  actualizarEstadoAlquilerSimulado,
  obtenerAlquilerSimuladoPorId,
  registrarGastoConfirmadoSimulado,
  registrarOperacionLogisticaConfirmadaSimulada,
} from './estadoSimulado.ts';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export type EscenarioSync = 'ok' | 'error' | 'ya_procesado' | 'sin_conexion';

let _escenarioSync: EscenarioSync = 'ok';

export function fijarEscenarioSync(e: EscenarioSync): void {
  _escenarioSync = e;
}

export function obtenerEscenarioSync(): EscenarioSync {
  return _escenarioSync;
}

/** Máximo de intentos automáticos antes de marcar error para reintento manual (RNM-17) */
export const MAX_REINTENTOS_AUTOMATICOS = 3;

/**
 * Aplica el efecto de confirmación en el estado simulado del servidor (RNM-16).
 */
function aplicarConfirmacionEnServidorSimulado(
  op: OperacionPendiente<unknown>
): { ok: true } | { ok: false; error: string } {
  if (op.tipo === 'entrega') {
    const alquiler = obtenerAlquilerSimuladoPorId(op.id_alquiler);
    if (!alquiler) {
      return { ok: false, error: `El alquiler #${op.id_alquiler} no existe en el servidor.` };
    }
    if (_escenarioSync !== 'ya_procesado' && !puedeRegistrarEntrega(alquiler.estado_alquiler)) {
      return {
        ok: false,
        error: `El servidor rechazó la entrega: el alquiler #${op.id_alquiler} está en estado "${alquiler.estado_alquiler}" (se requiere "pendiente").`,
      };
    }
    actualizarEstadoAlquilerSimulado(op.id_alquiler, 'activo');
    const payload = (op.payload ?? {}) as PayloadEntrega;
    registrarOperacionLogisticaConfirmadaSimulada({
      id: op.id,
      tipo: 'entrega',
      id_alquiler: op.id_alquiler,
      id_usuario: op.id_usuario,
      responsable_nombre: payload.responsable_nombre || 'Carlos Mendoza',
      observaciones: payload.observaciones,
      fecha: op.creadaEn,
    });
    return { ok: true };
  }

  if (op.tipo === 'recogida') {
    const alquiler = obtenerAlquilerSimuladoPorId(op.id_alquiler);
    if (!alquiler) {
      return { ok: false, error: `El alquiler #${op.id_alquiler} no existe en el servidor.` };
    }
    if (_escenarioSync !== 'ya_procesado' && !puedeRegistrarRecogida(alquiler.estado_alquiler)) {
      return {
        ok: false,
        error: `El servidor rechazó la recogida: el alquiler #${op.id_alquiler} está en estado "${alquiler.estado_alquiler}" (se requiere "activo" o "vencido").`,
      };
    }
    actualizarEstadoAlquilerSimulado(op.id_alquiler, 'recogido');
    const payload = (op.payload ?? {}) as PayloadRecogida;
    registrarOperacionLogisticaConfirmadaSimulada({
      id: op.id,
      tipo: 'recogida',
      id_alquiler: op.id_alquiler,
      id_usuario: op.id_usuario,
      responsable_nombre: payload.responsable_nombre || 'Carlos Mendoza',
      observaciones: payload.observaciones,
      fecha: op.creadaEn,
    });
    return { ok: true };
  }

  if (op.tipo === 'gasto') {
    const payload = op.payload as PayloadGasto;
    registrarGastoConfirmadoSimulado({
      id: op.id,
      id_operacion_cola: op.id,
      id_usuario: op.id_usuario,
      responsable_nombre: payload.responsable_nombre || 'Carlos Mendoza',
      descripcion: payload.descripcion,
      valor: payload.valor,
      fecha: payload.fecha || op.creadaEn,
      estado: 'confirmada',
      origen: 'simulado',
      asociaciones: payload.asociaciones,
    });
    return { ok: true };
  }

  return { ok: true };
}

async function sincronizarUna(
  op: OperacionPendiente<unknown>
): Promise<{ estado: OperacionPendiente['estado']; error?: string }> {
  await delay(120);

  if (_escenarioSync === 'sin_conexion') {
    return {
      estado: 'pendiente',
      error: 'Sin conexión a internet. La operación permanece en cola local.',
    };
  }

  if (_escenarioSync === 'error') {
    return {
      estado: 'error',
      error: 'Error del servidor simulado tras intento de sincronización.',
    };
  }

  const validacion = aplicarConfirmacionEnServidorSimulado(op);
  if (!validacion.ok) {
    return {
      estado: 'error',
      error: validacion.error,
    };
  }

  return { estado: 'confirmada' };
}

/**
 * Sincroniza todas las operaciones pendientes del usuario.
 * Aplica hasta MAX_REINTENTOS_AUTOMATICOS (3) intentos por operación (RNM-17).
 */
export async function sincronizarPendientes(id_usuario: string): Promise<{
  confirmadas: number;
  errores: number;
  pendientesRestantes: number;
  detalles: Array<{ id: string; estado: OperacionPendiente['estado']; error?: string }>;
}> {
  const pendientes = await obtenerNoConfirmadas(id_usuario);
  const detalles: Array<{
    id: string;
    estado: OperacionPendiente['estado'];
    error?: string;
  }> = [];

  if (_escenarioSync === 'sin_conexion') {
    return {
      confirmadas: 0,
      errores: 0,
      pendientesRestantes: pendientes.length,
      detalles: pendientes.map((p) => ({
        id: p.id,
        estado: 'pendiente',
        error: 'Dispositivo sin conexión.',
      })),
    };
  }

  for (const op of pendientes) {
    // Anti-duplicado (RNM-18) para entregas y recogidas
    if (op.tipo === 'entrega' || op.tipo === 'recogida') {
      const confirmada = await yaConfirmada(id_usuario, op.tipo, op.id_alquiler);
      if (confirmada) {
        await actualizarOperacion(id_usuario, op.id, { estado: 'confirmada' });
        detalles.push({ id: op.id, estado: 'confirmada' });
        continue;
      }
    }

    await actualizarOperacion(id_usuario, op.id, { estado: 'enviando' });

    let resultado: { estado: OperacionPendiente['estado']; error?: string } = {
      estado: 'error',
      error: 'Sin respuesta',
    };
    let intentos = op.intentos;

    for (let i = 0; i < MAX_REINTENTOS_AUTOMATICOS; i++) {
      intentos++;
      resultado = await sincronizarUna(op);
      if (resultado.estado === 'confirmada' || resultado.estado === 'pendiente') {
        break;
      }
      if (i < MAX_REINTENTOS_AUTOMATICOS - 1) {
        await delay(80);
      }
    }

    await actualizarOperacion(id_usuario, op.id, {
      estado: resultado.estado,
      intentos,
      ultimoError: resultado.error,
    });

    detalles.push({ id: op.id, estado: resultado.estado, error: resultado.error });
  }

  await limpiarConfirmadas(id_usuario);

  const restantes = await obtenerNoConfirmadas(id_usuario);
  const confirmadas = detalles.filter((d) => d.estado === 'confirmada').length;
  const errores = detalles.filter((d) => d.estado === 'error').length;

  return {
    confirmadas,
    errores,
    pendientesRestantes: restantes.length,
    detalles,
  };
}
