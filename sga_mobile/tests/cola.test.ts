/**
 * Tests — Cola de operaciones pendientes, sincronización y cancelación en cierre de sesión (§3.1, §3.5)
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fijarEscenarioSync,
  sincronizarPendientes,
} from '../src/services/mock/syncServiceMock.ts';
import {
  cancelarOperacionesPendientesUsuario,
  encolar,
  obtenerNoConfirmadas,
  obtenerPendientes,
} from '../src/storage/cola.ts';
import type { PayloadEntrega, PayloadGasto } from '../src/types/queue.ts';

describe('Cola de operaciones pendientes y sincronización', () => {
  it('encola operaciones aisladas por id_usuario (RNM-15)', async () => {
    await cancelarOperacionesPendientesUsuario('usr-test-1');
    await cancelarOperacionesPendientesUsuario('usr-test-2');

    await encolar<PayloadEntrega>('usr-test-1', {
      tipo: 'entrega',
      id_alquiler: 101,
      payload: { id_alquiler: 101, observaciones: 'Obs usuario 1' },
    });

    const cola1 = await obtenerPendientes('usr-test-1');
    const cola2 = await obtenerPendientes('usr-test-2');

    assert.equal(cola1.length, 1);
    assert.equal(cola2.length, 0);
  });

  it('evita duplicar entregas o recogidas pendientes para el mismo alquiler (RNM-18)', async () => {
    await cancelarOperacionesPendientesUsuario('usr-dup');

    const op1 = await encolar<PayloadEntrega>('usr-dup', {
      tipo: 'entrega',
      id_alquiler: 102,
      payload: { id_alquiler: 102 },
    });
    const op2 = await encolar<PayloadEntrega>('usr-dup', {
      tipo: 'entrega',
      id_alquiler: 102,
      payload: { id_alquiler: 102 },
    });

    assert.equal(op1.id, op2.id);
    const pendientes = await obtenerNoConfirmadas('usr-dup');
    assert.equal(pendientes.length, 1);
  });

  it('reintenta hasta 3 veces automáticas cuando el servidor falla y deja la operación en estado error (RNM-17)', async () => {
    await cancelarOperacionesPendientesUsuario('usr-retry');

    await encolar<PayloadGasto>('usr-retry', {
      tipo: 'gasto',
      id_alquiler: 101,
      payload: {
        descripcion: 'Gasto con fallo de red',
        valor: 40000,
        fecha: '2026-11-21T10:00:00.000Z',
        asociaciones: [{ id_alquiler: 101, tipo_movimiento: 'entrega' }],
      },
    });

    fijarEscenarioSync('error');
    const res = await sincronizarPendientes('usr-retry');
    fijarEscenarioSync('ok');

    assert.equal(res.confirmadas, 0);
    assert.equal(res.errores, 1);

    const noConfirmadas = await obtenerNoConfirmadas('usr-retry');
    assert.equal(noConfirmadas.length, 1);
    assert.equal(noConfirmadas[0].estado, 'error');
    assert.equal(noConfirmadas[0].intentos, 3);
  });

  it('permite cancelar expresamente las operaciones pendientes al confirmar cierre de sesión sin conexión (§3.1)', async () => {
    await cancelarOperacionesPendientesUsuario('usr-logout');

    await encolar<PayloadGasto>('usr-logout', {
      tipo: 'gasto',
      id_alquiler: 103,
      payload: {
        descripcion: 'Gasto pendiente al cerrar sesión',
        valor: 25000,
        fecha: '2026-11-21T11:00:00.000Z',
        asociaciones: [{ id_alquiler: 103, tipo_movimiento: 'recogida' }],
      },
    });

    const antes = await obtenerNoConfirmadas('usr-logout');
    assert.equal(antes.length, 1);

    const canceladas = await cancelarOperacionesPendientesUsuario('usr-logout');
    assert.equal(canceladas, 1);

    const despues = await obtenerNoConfirmadas('usr-logout');
    assert.equal(despues.length, 0);
  });
});
