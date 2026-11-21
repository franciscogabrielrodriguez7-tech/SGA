/**
 * Lógica pura del dominio de historial de operaciones — SGA Móvil (§3.5 / HU-11)
 *
 * Reglas implementadas:
 * - RNM-13: El historial móvil muestra únicamente las operaciones del encargado
 *   logístico autenticado.
 * - RNM-14: Las operaciones locales pendientes no se consideran confirmadas hasta
 *   recibir respuesta del servidor.
 * - Incluye entregas, recogidas y gastos en orden cronológico descendente.
 * - Filtros independientes (tipo, estado de sincronización, fecha).
 * - Búsqueda por ID, cliente, descripción/observaciones y tipo de operación.
 * - Generación de sugerencias de búsqueda a partir de los registros propios.
 */

import type { Alquiler } from '../types/models';
import type { GastoLogistico } from '../types/gastos';
import type {
  FiltrosHistorial,
  ReferenciaAlquilerHistorial,
  RegistroHistorial,
  TipoOperacionHistorial,
} from '../types/historial';
import type {
  OperacionPendiente,
  PayloadEntrega,
  PayloadGasto,
  PayloadRecogida,
} from '../types/queue';

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const ETIQUETA_TIPO_OPERACION: Record<TipoOperacionHistorial, string> = {
  entrega: 'Entrega',
  recogida: 'Recogida',
  gasto: 'Gasto logístico',
};

/**
 * Construye una referencia legible de alquiler a partir del catálogo local/simulado.
 */
export function construirReferenciaAlquiler(
  id_alquiler: number,
  alquileres: Alquiler[],
  tipo_movimiento?: 'entrega' | 'recogida'
): ReferenciaAlquilerHistorial {
  const encontrado = alquileres.find((a) => a.id_alquiler === id_alquiler);
  if (!encontrado) {
    return {
      id_alquiler,
      cliente_nombre: `Alquiler #${id_alquiler}`,
      direccion: 'Dirección no disponible en caché',
      barrio: '—',
      tipo_movimiento,
    };
  }
  return {
    id_alquiler,
    cliente_nombre: `${encontrado.cliente.nombres_cliente} ${encontrado.cliente.apellidos_cliente}`,
    direccion: encontrado.direccion,
    barrio: encontrado.barrio,
    tipo_movimiento,
  };
}

/**
 * Unifica las operaciones propias del encargado logístico autenticado:
 * 1. Entregas y recogidas ya confirmadas (simuladas o sincronizadas).
 * 2. Gastos propios (confirmados y pendientes).
 * 3. Operaciones de la cola local (`pendiente`, `enviando`, `error`) aún no confirmadas.
 *
 * Nunca incluye registros de otro usuario (RNM-13) y marca claramente los registros
 * locales aún no confirmados (RNM-14).
 */
export function unificarHistorialUsuario(params: {
  id_usuario: string;
  responsable_nombre: string;
  operacionesConfirmadas: RegistroHistorial[];
  gastosUsuario: GastoLogistico[];
  colaUsuario: OperacionPendiente<unknown>[];
  alquileres: Alquiler[];
}): RegistroHistorial[] {
  const {
    id_usuario,
    responsable_nombre,
    operacionesConfirmadas,
    gastosUsuario,
    colaUsuario,
    alquileres,
  } = params;

  const resultado = new Map<string, RegistroHistorial>();

  // 1. Operaciones de entrega/recogida confirmadas del usuario
  for (const op of operacionesConfirmadas) {
    if (op.id_usuario !== id_usuario) continue;
    resultado.set(op.id, {
      ...op,
      es_local_no_confirmado: op.estado_sincronizacion !== 'confirmada',
    });
  }

  // 2. Gastos propios del usuario
  for (const g of gastosUsuario) {
    if (g.id_usuario !== id_usuario) continue;
    const refs = g.asociaciones.map((asoc) =>
      construirReferenciaAlquiler(asoc.id_alquiler, alquileres, asoc.tipo_movimiento)
    );
    const idPrincipal = g.asociaciones[0]?.id_alquiler ?? 0;
    const clave = g.id_operacion_cola ? `cola-${g.id_operacion_cola}` : `gasto-${g.id}`;

    resultado.set(clave, {
      id: g.id,
      tipo: 'gasto',
      fecha: g.fecha,
      id_usuario: g.id_usuario,
      responsable_nombre: g.responsable_nombre || responsable_nombre,
      id_alquiler_principal: idPrincipal,
      alquileres_relacionados: refs,
      valor: g.valor,
      detalle_texto: g.descripcion,
      estado_sincronizacion: g.estado,
      es_local_no_confirmado: g.estado !== 'confirmada',
      origen: g.origen,
      ultimoError: g.ultimoError,
    });
  }

  // 3. Operaciones en cola local del usuario (no confirmadas aún)
  for (const itemCola of colaUsuario) {
    if (itemCola.id_usuario !== id_usuario) continue;
    if (itemCola.estado === 'confirmada') continue;

    const clave = `cola-${itemCola.id}`;
    if (resultado.has(clave)) continue;

    if (itemCola.tipo === 'gasto') {
      const payload = itemCola.payload as PayloadGasto;
      const refs = (payload.asociaciones ?? []).map((asoc) =>
        construirReferenciaAlquiler(asoc.id_alquiler, alquileres, asoc.tipo_movimiento)
      );
      resultado.set(clave, {
        id: itemCola.id,
        tipo: 'gasto',
        fecha: payload.fecha || itemCola.creadaEn,
        id_usuario,
        responsable_nombre: payload.responsable_nombre || responsable_nombre,
        id_alquiler_principal: itemCola.id_alquiler,
        alquileres_relacionados: refs,
        valor: payload.valor,
        detalle_texto: payload.descripcion,
        estado_sincronizacion: itemCola.estado,
        es_local_no_confirmado: true,
        origen: 'local',
        intentos: itemCola.intentos,
        ultimoError: itemCola.ultimoError,
      });
    } else {
      const payload = itemCola.payload as PayloadEntrega | PayloadRecogida;
      const ref = construirReferenciaAlquiler(
        itemCola.id_alquiler,
        alquileres,
        itemCola.tipo
      );
      resultado.set(clave, {
        id: itemCola.id,
        tipo: itemCola.tipo,
        fecha: itemCola.creadaEn,
        id_usuario,
        responsable_nombre: payload.responsable_nombre || responsable_nombre,
        id_alquiler_principal: itemCola.id_alquiler,
        alquileres_relacionados: [ref],
        detalle_texto:
          payload.observaciones?.trim() ||
          `Registro local de ${itemCola.tipo} sin observaciones adicionales.`,
        estado_sincronizacion: itemCola.estado,
        es_local_no_confirmado: true,
        origen: 'local',
        intentos: itemCola.intentos,
        ultimoError: itemCola.ultimoError,
      });
    }
  }

  return ordenarHistorialDescendente(Array.from(resultado.values()));
}

/**
 * Ordena los registros en orden cronológico descendente (más reciente primero).
 */
export function ordenarHistorialDescendente(
  registros: RegistroHistorial[]
): RegistroHistorial[] {
  return [...registros].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/**
 * Filtra los registros del historial aplicando filtros independientes y búsqueda (§3.5):
 * - Tipo de operación: 'todos' | 'entrega' | 'recogida' | 'gasto'
 * - Estado: 'todos' | 'confirmados' | 'pendientes' | 'error'
 * - Día: YYYY-MM-DD
 * - Búsqueda por ID (de operación o alquiler), cliente, descripción/observaciones y tipo.
 */
export function filtrarHistorial(
  registros: RegistroHistorial[],
  filtros: FiltrosHistorial = {}
): RegistroHistorial[] {
  const tipo = filtros.tipo ?? 'todos';
  const estado = filtros.estado ?? 'todos';
  const dia = filtros.dia?.trim() || '';
  const q = filtros.busqueda ? normalizar(filtros.busqueda) : '';

  return ordenarHistorialDescendente(
    registros.filter((r) => {
      if (tipo !== 'todos' && r.tipo !== tipo) return false;

      if (estado === 'confirmados' && r.es_local_no_confirmado) return false;
      if (
        estado === 'pendientes' &&
        r.estado_sincronizacion !== 'pendiente' &&
        r.estado_sincronizacion !== 'enviando'
      ) {
        return false;
      }
      if (estado === 'error' && r.estado_sincronizacion !== 'error') return false;

      if (dia && r.fecha.slice(0, 10) !== dia) return false;

      if (q) {
        const clientes = r.alquileres_relacionados
          .map((a) => `#${a.id_alquiler} ${a.id_alquiler} ${a.cliente_nombre} ${a.direccion} ${a.barrio} ${a.tipo_movimiento ?? ''}`)
          .join(' ');
        const textoBusqueda = normalizar(
          `${r.id} #${r.id_alquiler_principal} ${r.id_alquiler_principal} ${r.tipo} ${ETIQUETA_TIPO_OPERACION[r.tipo]} ${r.detalle_texto} ${r.responsable_nombre} ${clientes}`
        );
        if (!textoBusqueda.includes(q)) return false;
      }

      return true;
    })
  );
}

/**
 * Genera sugerencias de búsqueda dinámicas a partir de los registros propios del usuario (§3.5).
 */
export function generarSugerenciasHistorial(
  registros: RegistroHistorial[],
  textoActual = '',
  limite = 6
): string[] {
  const candidatos = new Set<string>();

  // Sugerencias base de tipos
  candidatos.add('Entrega');
  candidatos.add('Recogida');
  candidatos.add('Gasto');

  for (const r of registros) {
    candidatos.add(`#${r.id_alquiler_principal}`);
    for (const rel of r.alquileres_relacionados) {
      candidatos.add(`#${rel.id_alquiler}`);
      if (rel.cliente_nombre) candidatos.add(rel.cliente_nombre);
    }
  }

  const lista = Array.from(candidatos);
  const q = normalizar(textoActual);
  if (!q) return lista.slice(0, limite);

  return lista
    .filter((item) => {
      const n = normalizar(item);
      return n.includes(q) && n !== q;
    })
    .slice(0, limite);
}
