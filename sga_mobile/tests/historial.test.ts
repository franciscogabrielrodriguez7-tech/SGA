/**
 * Pruebas unitarias de Historial de Operaciones — SGA Móvil (§3.5)
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ALQUILERES_MOCK } from '../src/data/mock/alquileres.ts';
import { GASTOS_INICIALES_MOCK } from '../src/data/mock/gastos.ts';
import { HISTORIAL_OPERACIONES_INICIAL_MOCK } from '../src/data/mock/historial.ts';
import {
  filtrarHistorial,
  generarSugerenciasHistorial,
  unificarHistorialUsuario,
} from '../src/domain/historial.ts';
import type { OperacionPendiente } from '../src/types/queue.ts';

describe('Historial — Unificación, aislamiento, filtros y sugerencias (§3.5)', () => {
  const colaMock: OperacionPendiente[] = [
    {
      id: 'op-local-ent-101',
      tipo: 'entrega',
      id_alquiler: 101,
      id_usuario: 'usr-001',
      payload: {
        id_alquiler: 101,
        observaciones: 'Entrega registrada sin conexión en obra',
        responsable_nombre: 'Carlos Mendoza',
      },
      creadaEn: '2026-11-21T15:00:00.000Z',
      estado: 'pendiente',
      intentos: 0,
    },
    {
      id: 'op-local-otro-usuario',
      tipo: 'recogida',
      id_alquiler: 108,
      id_usuario: 'usr-002',
      payload: {
        id_alquiler: 108,
        observaciones: 'No debe aparecer para usr-001',
      },
      creadaEn: '2026-11-21T16:00:00.000Z',
      estado: 'pendiente',
      intentos: 0,
    },
  ];

  const historialUnificado = unificarHistorialUsuario({
    id_usuario: 'usr-001',
    responsable_nombre: 'Carlos Mendoza',
    operacionesConfirmadas: HISTORIAL_OPERACIONES_INICIAL_MOCK,
    gastosUsuario: GASTOS_INICIALES_MOCK,
    colaUsuario: colaMock,
    alquileres: ALQUILERES_MOCK,
  });

  it('incluye entregas, recogidas y gastos exclusivamente del encargado logístico autenticado (RNM-13)', () => {
    assert.ok(historialUnificado.length > 0);
    assert.ok(historialUnificado.every((r) => r.id_usuario === 'usr-001'));

    const tiposPresentes = new Set(historialUnificado.map((r) => r.tipo));
    assert.ok(tiposPresentes.has('entrega'));
    assert.ok(tiposPresentes.has('recogida'));
    assert.ok(tiposPresentes.has('gasto'));
  });

  it('ordena los registros en orden cronológico descendente', () => {
    for (let i = 1; i < historialUnificado.length; i++) {
      assert.ok(
        historialUnificado[i - 1].fecha >= historialUnificado[i].fecha,
        `Desorden entre ${historialUnificado[i - 1].fecha} y ${historialUnificado[i].fecha}`
      );
    }
  });

  it('identifica claramente las operaciones locales todavía no confirmadas (RNM-14)', () => {
    const opLocal = historialUnificado.find((r) => r.id === 'op-local-ent-101');
    assert.ok(opLocal, 'La entrega local en cola debe aparecer en el historial');
    assert.equal(opLocal.es_local_no_confirmado, true);
    assert.equal(opLocal.origen, 'local');

    const opConfirmada = historialUnificado.find((r) => r.id === 'ent-201');
    assert.ok(opConfirmada);
    assert.equal(opConfirmada.es_local_no_confirmado, false);
  });

  it('aplica filtros independientes por tipo, estado y fecha, y búsqueda por texto', () => {
    const soloEntregas = filtrarHistorial(historialUnificado, { tipo: 'entrega' });
    assert.ok(soloEntregas.every((r) => r.tipo === 'entrega'));

    const soloPendientes = filtrarHistorial(historialUnificado, {
      estado: 'pendientes',
    });
    assert.ok(soloPendientes.length >= 2); // op-local-ent-101 + gas-104
    assert.ok(soloPendientes.every((r) => r.es_local_no_confirmado));

    const porCliente = filtrarHistorial(historialUnificado, {
      busqueda: 'Roble',
    });
    assert.ok(porCliente.length >= 1);
    assert.ok(
      porCliente.every((r) =>
        r.alquileres_relacionados.some((a) => a.cliente_nombre.includes('Roble'))
      )
    );
  });

  it('genera sugerencias de búsqueda relevantes a partir de los registros propios', () => {
    const sugerenciasIniciales = generarSugerenciasHistorial(
      historialUnificado,
      ''
    );
    assert.ok(sugerenciasIniciales.length > 0);

    const sugerenciasAlquiler = generarSugerenciasHistorial(
      historialUnificado,
      '#10'
    );
    assert.ok(sugerenciasAlquiler.some((s) => s.startsWith('#10')));
  });
});
