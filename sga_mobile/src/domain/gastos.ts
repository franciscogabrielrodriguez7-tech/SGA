/**
 * Lógica pura del dominio de gastos — SGA Móvil (§3.3 y §3.4)
 *
 * Reglas implementadas:
 * - RNM-09: El valor de un gasto es global y estrictamente positivo (> 0);
 *   requiere descripción y al menos un alquiler asociado.
 * - RNM-10: Un gasto puede relacionarse con varios alquileres y cada asociación
 *   identifica el tipo de movimiento: 'entrega' o 'recogida'.
 * - RNM-11: Un mismo alquiler puede repetirse en un gasto únicamente cuando las
 *   asociaciones corresponden a tipos de movimiento diferentes.
 * - RNM-12: El encargado logístico no puede editar ni eliminar gastos desde el móvil.
 * - El valor corresponde al gasto total: NO se multiplica por el número de
 *   asociaciones ni se distribuye automáticamente.
 */

import type { Alquiler } from '../types/models';
import type {
  AsociacionGasto,
  FiltrosGastos,
  GastoLogistico,
  ResumenSemanalGastos,
  TipoMovimientoAsociacion,
} from '../types/gastos';
import { esVisibleEnMovil } from './alquileres.ts';
import { aISO, parseISO, sumarDias } from './fechas.ts';

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/**
 * Parsea un texto numérico a valor monetario positivo.
 * Retorna null si es vacío, no numérico, NaN, infinito o <= 0.
 */
export function parsearValorPositivo(texto: string): number | null {
  const limpio = texto.replace(/[\s$.]/g, '').replace(',', '.').trim();
  if (!limpio) return null;
  const numero = Number(limpio);
  if (!Number.isFinite(numero) || numero <= 0) return null;
  return Math.round(numero);
}

/**
 * Verifica si una asociación (id_alquiler + tipo_movimiento) ya existe en la lista.
 */
export function existeAsociacionDuplicada(
  asociaciones: AsociacionGasto[],
  candidata: AsociacionGasto,
  ignorarIndice?: number
): boolean {
  return asociaciones.some(
    (a, idx) =>
      idx !== ignorarIndice &&
      a.id_alquiler === candidata.id_alquiler &&
      a.tipo_movimiento === candidata.tipo_movimiento
  );
}

/**
 * Agrega una asociación de alquiler al borrador de gasto cumpliendo RNM-10 y RNM-11:
 * - Permite el mismo alquiler si el tipo de movimiento ('entrega' | 'recogida') es diferente.
 * - Impide repetir el mismo alquiler con el mismo tipo de movimiento.
 */
export function agregarAsociacionGasto(
  actuales: AsociacionGasto[],
  nueva: AsociacionGasto
): { ok: true; asociaciones: AsociacionGasto[] } | { ok: false; error: string } {
  if (existeAsociacionDuplicada(actuales, nueva)) {
    return {
      ok: false,
      error: `El alquiler #${nueva.id_alquiler} ya está asociado con el movimiento de ${nueva.tipo_movimiento}. Solo puede repetirse con un tipo de movimiento diferente.`,
    };
  }
  return { ok: true, asociaciones: [...actuales, nueva] };
}

/**
 * Modifica el tipo de movimiento de una asociación existente en el índice indicado.
 * Impide el cambio si generaría un duplicado (mismo alquiler + mismo tipo de movimiento).
 */
export function modificarTipoMovimientoAsociacion(
  actuales: AsociacionGasto[],
  indice: number,
  nuevoTipo: TipoMovimientoAsociacion
): { ok: true; asociaciones: AsociacionGasto[] } | { ok: false; error: string } {
  if (indice < 0 || indice >= actuales.length) {
    return { ok: false, error: 'Índice de asociación fuera de rango.' };
  }
  const objetivo = actuales[indice];
  const candidata: AsociacionGasto = {
    id_alquiler: objetivo.id_alquiler,
    tipo_movimiento: nuevoTipo,
  };

  if (existeAsociacionDuplicada(actuales, candidata, indice)) {
    return {
      ok: false,
      error: `El alquiler #${objetivo.id_alquiler} ya tiene otra asociación con movimiento de ${nuevoTipo}.`,
    };
  }

  const nuevas = actuales.map((item, idx) => (idx === indice ? candidata : item));
  return { ok: true, asociaciones: nuevas };
}

/**
 * Quita una asociación por su índice.
 */
export function quitarAsociacionGasto(
  actuales: AsociacionGasto[],
  indice: number
): AsociacionGasto[] {
  return actuales.filter((_, idx) => idx !== indice);
}

/**
 * Valida un gasto completo antes de su confirmación y guardado (§3.3).
 */
export function validarRegistroGasto(entrada: {
  valorTexto: string;
  descripcion: string;
  asociaciones: AsociacionGasto[];
}):
  | {
      ok: true;
      valor: number;
      descripcion: string;
      asociaciones: AsociacionGasto[];
    }
  | { ok: false; error: string } {
  const valor = parsearValorPositivo(entrada.valorTexto);
  if (valor === null || valor <= 0) {
    return {
      ok: false,
      error: 'El valor del gasto debe ser un número positivo mayor que cero.',
    };
  }

  const descripcion = entrada.descripcion.trim();
  if (!descripcion) {
    return {
      ok: false,
      error: 'La descripción u observación del gasto es obligatoria.',
    };
  }

  if (!entrada.asociaciones || entrada.asociaciones.length === 0) {
    return {
      ok: false,
      error: 'Debes asociar al menos un alquiler al gasto.',
    };
  }

  // Verificar que no existan asociaciones duplicadas (mismo alquiler y mismo tipo)
  for (let i = 0; i < entrada.asociaciones.length; i++) {
    const a = entrada.asociaciones[i];
    if (a.tipo_movimiento !== 'entrega' && a.tipo_movimiento !== 'recogida') {
      return {
        ok: false,
        error: 'Cada asociación debe tener tipo de movimiento "entrega" o "recogida".',
      };
    }
    if (existeAsociacionDuplicada(entrada.asociaciones, a, i)) {
      return {
        ok: false,
        error: `El alquiler #${a.id_alquiler} está repetido con el mismo tipo de movimiento (${a.tipo_movimiento}).`,
      };
    }
  }

  return {
    ok: true,
    valor,
    descripcion,
    asociaciones: [...entrada.asociaciones],
  };
}

/**
 * Busca alquileres elegibles (no cancelados) por ID o nombre/documento del cliente (§3.3).
 */
export function buscarAlquileresPorIdOCliente(
  alquileres: Alquiler[],
  texto: string
): Alquiler[] {
  const visibles = alquileres.filter(esVisibleEnMovil);
  const q = normalizar(texto);
  if (!q) return visibles;

  return visibles.filter((a) => {
    const campos = [
      String(a.id_alquiler),
      `#${a.id_alquiler}`,
      a.cliente.nombres_cliente,
      a.cliente.apellidos_cliente,
      `${a.cliente.nombres_cliente} ${a.cliente.apellidos_cliente}`,
      a.cliente.id_usuario_cliente,
    ].map(normalizar);

    return campos.some((c) => c.includes(q));
  });
}

/**
 * Filtra y ordena los gastos propios del encargado logístico (§3.4):
 * - Solo gastos del id_usuario autenticado (RNM-13 / HU-09).
 * - Filtros por día (YYYY-MM-DD), descripción y rango de valor.
 * - Orden cronológico descendente.
 */
export function filtrarGastosPropios(
  gastos: GastoLogistico[],
  id_usuario: string,
  filtros: FiltrosGastos = {}
): GastoLogistico[] {
  const diaFiltro = filtros.dia?.trim() || '';
  const descFiltro = filtros.descripcion ? normalizar(filtros.descripcion) : '';
  const min = filtros.valorMin;
  const max = filtros.valorMax;

  return gastos
    .filter((g) => g.id_usuario === id_usuario)
    .filter((g) => {
      if (diaFiltro && g.fecha.slice(0, 10) !== diaFiltro) return false;
      if (descFiltro) {
        const textoGasto = normalizar(
          `${g.descripcion} ${g.asociaciones.map((a) => `#${a.id_alquiler} ${a.tipo_movimiento}`).join(' ')}`
        );
        if (!textoGasto.includes(descFiltro)) return false;
      }
      if (min !== undefined && Number.isFinite(min) && g.valor < min) return false;
      if (max !== undefined && Number.isFinite(max) && g.valor > max) return false;
      return true;
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/**
 * Calcula el lunes y el domingo (YYYY-MM-DD) de la semana correspondiente
 * a `fechaReferenciaISO`, aplicando `desplazamientoSemanas` (0 = semana actual,
 * -1 = semana anterior, etc.).
 * La semana va estrictamente de lunes a domingo (§3.4).
 */
export function obtenerRangoSemanaLunesADomingo(
  fechaReferenciaISO: string,
  desplazamientoSemanas = 0
): { lunes: string; domingo: string } {
  const baseISO = fechaReferenciaISO.slice(0, 10);
  const fecha = parseISO(baseISO);
  // getUTCDay(): 0 = domingo, 1 = lunes, ..., 6 = sábado
  const diaSemana = fecha.getUTCDay();
  const distanciaALunes = diaSemana === 0 ? -6 : 1 - diaSemana;

  const lunesBase = sumarDias(baseISO, distanciaALunes + desplazamientoSemanas * 7);
  const domingoBase = sumarDias(lunesBase, 6);

  return {
    lunes: aISO(parseISO(lunesBase)),
    domingo: aISO(parseISO(domingoBase)),
  };
}

/**
 * Calcula el resumen semanal de lunes a domingo para el encargado logístico (§3.4).
 * - El valor de cada gasto es su valor global (nunca se multiplica por asociaciones).
 * - Separa gastos confirmados y gastos pendientes locales.
 * - Calcula tanto el promedio diario (total de la semana / 7) como el promedio semanal
 *   (promedio por semana entre las semanas que registran gastos del usuario).
 */
export function calcularResumenSemanalGastos(
  gastos: GastoLogistico[],
  id_usuario: string,
  fechaReferenciaISO: string,
  desplazamientoSemanas = 0
): ResumenSemanalGastos {
  const propios = gastos.filter((g) => g.id_usuario === id_usuario);
  const { lunes, domingo } = obtenerRangoSemanaLunesADomingo(
    fechaReferenciaISO,
    desplazamientoSemanas
  );

  const gastosSemana = propios
    .filter((g) => {
      const dia = g.fecha.slice(0, 10);
      return dia >= lunes && dia <= domingo;
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  let totalConfirmado = 0;
  let totalPendienteLocal = 0;
  let cantidadConfirmados = 0;
  let cantidadPendientesLocales = 0;

  for (const g of gastosSemana) {
    if (g.estado === 'confirmada') {
      totalConfirmado += g.valor;
      cantidadConfirmados++;
    } else {
      totalPendienteLocal += g.valor;
      cantidadPendientesLocales++;
    }
  }

  const total = totalConfirmado + totalPendienteLocal;
  const promedio_diario = Math.round(total / 7);

  // Promedio semanal sobre las semanas con actividad del usuario (o la semana actual si solo hay 1)
  const totalesPorSemana = new Map<string, number>();
  for (const g of propios) {
    const { lunes: lunesGasto } = obtenerRangoSemanaLunesADomingo(g.fecha.slice(0, 10), 0);
    totalesPorSemana.set(lunesGasto, (totalesPorSemana.get(lunesGasto) ?? 0) + g.valor);
  }
  const numSemanasConGastos = totalesPorSemana.size;
  const sumaTotalHistorica = propios.reduce((acc, g) => acc + g.valor, 0);
  const promedio_semanal =
    numSemanasConGastos > 0 ? Math.round(sumaTotalHistorica / numSemanasConGastos) : 0;

  return {
    semana_inicio: lunes,
    semana_fin: domingo,
    desplazamiento_semanas: desplazamientoSemanas,
    total,
    total_confirmado: totalConfirmado,
    total_pendiente_local: totalPendienteLocal,
    promedio_diario,
    promedio_semanal,
    cantidad_gastos: gastosSemana.length,
    cantidad_confirmados: cantidadConfirmados,
    cantidad_pendientes_locales: cantidadPendientesLocales,
    gastos: gastosSemana,
  };
}
