/**
 * Cola de operaciones pendientes — SGA Móvil (§3.1, §3.3, §3.5)
 *
 * - Las operaciones quedan vinculadas al `id_usuario` que las creó.
 * - Incluye respaldo en memoria para ejecución de pruebas en Node.js.
 * - Notifica a los suscriptores cuando cambia el estado de la cola.
 * - Soporta cancelación expresa de operaciones pendientes al confirmar cierre
 *   de sesión sin conexión (§3.1).
 */

import type { OperacionPendiente } from '../types/queue.ts';
import { kvGet, kvRemove, kvSet } from './kvAdapter.ts';

function claveUsuario(id_usuario: string): string {
  return `sga_mobile_cola_${id_usuario}_v1`;
}

type ListenerCola = () => void;
const listeners = new Set<ListenerCola>();

function notificarCambioCola(): void {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      // Ignorar errores de listener
    }
  }
}

/** Permite a las pantallas suscribirse a cambios en la cola local */
export function suscribirCola(listener: ListenerCola): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function leerColaRaw(clave: string): Promise<string | null> {
  return kvGet(clave);
}

async function escribirColaRaw(clave: string, valor: string): Promise<void> {
  await kvSet(clave, valor);
  notificarCambioCola();
}

async function borrarColaRaw(clave: string): Promise<void> {
  await kvRemove(clave);
  notificarCambioCola();
}

/** Genera un identificador único local para la operación */
function generarId(): string {
  return `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Encola una operación pendiente para el usuario indicado.
 * Evita duplicar una operación idéntica de entrega o recogida si ya existe una
 * pendiente o confirmada para el mismo alquiler y tipo (RNM-18).
 */
export async function encolar<T>(
  id_usuario: string,
  operacion: Omit<
    OperacionPendiente<T>,
    'id' | 'id_usuario' | 'creadaEn' | 'estado' | 'intentos'
  >
): Promise<OperacionPendiente<T>> {
  const existentes = await obtenerPendientes<T>(id_usuario);

  // Prevención de duplicados en entregas y recogidas para el mismo alquiler
  if (operacion.tipo === 'entrega' || operacion.tipo === 'recogida') {
    const duplicada = existentes.find(
      (op) =>
        op.tipo === operacion.tipo &&
        op.id_alquiler === operacion.id_alquiler &&
        (op.estado === 'pendiente' || op.estado === 'enviando' || op.estado === 'confirmada')
    );
    if (duplicada) {
      return duplicada;
    }
  }

  const nueva: OperacionPendiente<T> = {
    ...operacion,
    id: generarId(),
    id_usuario,
    creadaEn: new Date().toISOString(),
    estado: 'pendiente',
    intentos: 0,
  };

  existentes.push(nueva);
  await escribirColaRaw(claveUsuario(id_usuario), JSON.stringify(existentes));
  return nueva;
}

/** Obtiene todas las operaciones almacenadas en la cola del usuario */
export async function obtenerPendientes<T = unknown>(
  id_usuario: string
): Promise<OperacionPendiente<T>[]> {
  try {
    const valor = await leerColaRaw(claveUsuario(id_usuario));
    if (!valor) return [];
    return JSON.parse(valor) as OperacionPendiente<T>[];
  } catch {
    return [];
  }
}

/** Obtiene únicamente las operaciones aún no confirmadas ('pendiente', 'enviando' o 'error') */
export async function obtenerNoConfirmadas<T = unknown>(
  id_usuario: string
): Promise<OperacionPendiente<T>[]> {
  const todas = await obtenerPendientes<T>(id_usuario);
  return todas.filter((op) => op.estado !== 'confirmada');
}

/** Actualiza una operación existente por su ID */
export async function actualizarOperacion<T = unknown>(
  id_usuario: string,
  id: string,
  cambios: Partial<Omit<OperacionPendiente<T>, 'id' | 'id_usuario'>>
): Promise<void> {
  const todas = await obtenerPendientes<T>(id_usuario);
  const actualizadas = todas.map((op) =>
    op.id === id ? { ...op, ...cambios } : op
  );
  await escribirColaRaw(claveUsuario(id_usuario), JSON.stringify(actualizadas));
}

/** Elimina las operaciones ya confirmadas de la cola local */
export async function limpiarConfirmadas(id_usuario: string): Promise<void> {
  const todas = await obtenerPendientes(id_usuario);
  const sinConfirmadas = todas.filter((op) => op.estado !== 'confirmada');
  await escribirColaRaw(claveUsuario(id_usuario), JSON.stringify(sinConfirmadas));
}

/**
 * Cancela y elimina expresamente las operaciones pendientes del usuario (§3.1).
 * Solo debe invocarse cuando el usuario ha confirmado expresamente la cancelación
 * al cerrar sesión sin conexión.
 */
export async function cancelarOperacionesPendientesUsuario(
  id_usuario: string
): Promise<number> {
  const noConfirmadas = await obtenerNoConfirmadas(id_usuario);
  const cantidad = noConfirmadas.length;
  await borrarColaRaw(claveUsuario(id_usuario));
  return cantidad;
}

/** Comprueba si ya existe una operación confirmada para el mismo alquiler y tipo */
export async function yaConfirmada(
  id_usuario: string,
  tipo: OperacionPendiente['tipo'],
  id_alquiler: number
): Promise<boolean> {
  const todas = await obtenerPendientes(id_usuario);
  return todas.some(
    (op) => op.tipo === tipo && op.id_alquiler === id_alquiler && op.estado === 'confirmada'
  );
}
