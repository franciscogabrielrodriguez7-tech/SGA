/**
 * Estado reactivo compartido del entorno simulado — SGA Móvil
 *
 * Mantiene en memoria (y sincronizado entre servicios mock) el catálogo de:
 * - Alquileres (para que confirmar una entrega cambie el alquiler de 'pendiente'
 *   a 'activo' y una recogida lo cambie a 'recogido', según RNM-16 / RN-AUD-19 / RN-LOG-04).
 * - Gastos confirmados.
 * - Operaciones de entrega y recogida confirmadas.
 */

import { ALQUILERES_MOCK } from '../../data/mock/alquileres.ts';
import { GASTOS_INICIALES_MOCK } from '../../data/mock/gastos.ts';
import { HISTORIAL_OPERACIONES_INICIAL_MOCK } from '../../data/mock/historial.ts';
import { construirReferenciaAlquiler } from '../../domain/historial.ts';
import type { GastoLogistico } from '../../types/gastos.ts';
import type { RegistroHistorial } from '../../types/historial.ts';
import type { Alquiler, EstadoAlquiler } from '../../types/models.ts';

let alquileresEstado: Alquiler[] = ALQUILERES_MOCK.map((a) => ({
  ...a,
  cliente: { ...a.cliente },
  detalles: a.detalles.map((d) => ({ ...d })),
}));

let gastosConfirmadosEstado: GastoLogistico[] = GASTOS_INICIALES_MOCK.map((g) => ({
  ...g,
  asociaciones: g.asociaciones.map((a) => ({ ...a })),
}));

let operacionesConfirmadasEstado: RegistroHistorial[] =
  HISTORIAL_OPERACIONES_INICIAL_MOCK.map((op) => ({
    ...op,
    alquileres_relacionados: op.alquileres_relacionados.map((r) => ({ ...r })),
  }));

type ListenerEstado = () => void;
const listeners = new Set<ListenerEstado>();

export function suscribirEstadoSimulado(fn: ListenerEstado): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function notificar(): void {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      // Ignorar errores de listener
    }
  }
}

export function obtenerAlquileresSimulados(): Alquiler[] {
  return alquileresEstado;
}

export function obtenerAlquilerSimuladoPorId(id: number): Alquiler | null {
  return alquileresEstado.find((a) => a.id_alquiler === id) ?? null;
}

export function actualizarEstadoAlquilerSimulado(
  id_alquiler: number,
  nuevoEstado: EstadoAlquiler
): void {
  alquileresEstado = alquileresEstado.map((a) =>
    a.id_alquiler === id_alquiler ? { ...a, estado_alquiler: nuevoEstado } : a
  );
  notificar();
}

export function obtenerGastosSimulados(): GastoLogistico[] {
  return gastosConfirmadosEstado;
}

export function registrarGastoConfirmadoSimulado(gasto: GastoLogistico): void {
  const sinPrevio = gastosConfirmadosEstado.filter(
    (g) => g.id !== gasto.id && (!gasto.id_operacion_cola || g.id_operacion_cola !== gasto.id_operacion_cola)
  );
  gastosConfirmadosEstado = [
    { ...gasto, estado: 'confirmada', origen: 'simulado' },
    ...sinPrevio,
  ];
  notificar();
}

export function obtenerOperacionesConfirmadasSimuladas(): RegistroHistorial[] {
  return operacionesConfirmadasEstado;
}

export function registrarOperacionLogisticaConfirmadaSimulada(params: {
  id: string;
  tipo: 'entrega' | 'recogida';
  id_alquiler: number;
  id_usuario: string;
  responsable_nombre: string;
  observaciones?: string;
  fecha: string;
}): void {
  const ref = construirReferenciaAlquiler(
    params.id_alquiler,
    alquileresEstado,
    params.tipo
  );
  const nuevo: RegistroHistorial = {
    id: params.id,
    tipo: params.tipo,
    fecha: params.fecha,
    id_usuario: params.id_usuario,
    responsable_nombre: params.responsable_nombre,
    id_alquiler_principal: params.id_alquiler,
    alquileres_relacionados: [ref],
    detalle_texto:
      params.observaciones?.trim() ||
      `${params.tipo === 'entrega' ? 'Entrega' : 'Recogida'} completa confirmada sin observaciones adicionales.`,
    estado_sincronizacion: 'confirmada',
    es_local_no_confirmado: false,
    origen: 'simulado',
  };

  operacionesConfirmadasEstado = [
    nuevo,
    ...operacionesConfirmadasEstado.filter((op) => op.id !== params.id),
  ];
  notificar();
}
