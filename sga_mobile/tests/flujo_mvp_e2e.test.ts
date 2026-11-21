/**
 * Pruebas integrales de extremo a extremo de los 16 criterios del MVP — SGA Móvil (§8)
 *
 * Verifica de forma integrada los servicios, almacenamiento local, reglas de dominio
 * y máquina de estados simulada para los 16 flujos exigidos en el MVP.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fijarEscenario } from '../src/data/mock/escenario.ts';
import { filtrarGastosPropios } from '../src/domain/gastos.ts';
import { filtrarHistorial } from '../src/domain/historial.ts';
import { alquileresServiceMock } from '../src/services/mock/alquileresServiceMock.ts';
import { authServiceMock, simularSinConexion } from '../src/services/mock/authServiceMock.ts';
import { gastosServiceMock } from '../src/services/mock/gastosServiceMock.ts';
import { historialServiceMock } from '../src/services/mock/historialServiceMock.ts';
import {
  fijarEscenarioMapa,
  mapServiceMock,
} from '../src/services/mock/mapServiceMock.ts';
import {
  fijarEscenarioSync,
  sincronizarPendientes,
} from '../src/services/mock/syncServiceMock.ts';
import {
  cancelarOperacionesPendientesUsuario,
  encolar,
  obtenerNoConfirmadas,
} from '../src/storage/cola.ts';
import {
  eliminarSesion,
  restaurarSesionCompleta,
  simularReinicioAppMemoria,
} from '../src/storage/sesion.ts';
import type { PayloadEntrega, PayloadRecogida } from '../src/types/queue.ts';

describe('Recorrido integral de extremo a extremo (16 criterios del MVP)', () => {
  it('ejecuta los 16 criterios del MVP desde login hasta cierre de sesión seguro', async () => {
    fijarEscenario('normal');
    fijarEscenarioSync('ok');
    simularSinConexion(false);
    await cancelarOperacionesPendientesUsuario('usr-001');

    // 1. Inicio de sesión y 12. Persistencia local al reiniciar
    const login = await authServiceMock.login('logistico1', 'demo123');
    assert.equal(login.ok, true);
    if (!login.ok) return;

    simularReinicioAppMemoria();
    const sesionRestaurada = await restaurarSesionCompleta();
    assert.ok(sesionRestaurada !== null);
    assert.equal(sesionRestaurada.id_usuario, 'usr-001');

    // 2. Consulta de alquileres (sin cancelados) y 3. Consulta de detalles
    const listado = await alquileresServiceMock.listar();
    assert.ok(listado.datos.length > 0);
    assert.ok(listado.datos.every((a) => a.estado_alquiler !== 'cancelado'));

    const detalle101 = await alquileresServiceMock.obtener(101);
    assert.ok(detalle101.datos !== null);
    assert.equal(detalle101.datos.estado_alquiler, 'pendiente');

    // 4. Visualización simulada del mapa y estados de error
    fijarEscenarioMapa('ok');
    const geoOk = await mapServiceMock.geocodificar(
      detalle101.datos.direccion,
      detalle101.datos.barrio
    );
    assert.equal(geoOk.ok, true);

    fijarEscenarioMapa('permiso_denegado');
    const ubicacionDenegada = await mapServiceMock.obtenerUbicacionActual();
    assert.equal(ubicacionDenegada.ok, false);
    fijarEscenarioMapa('ok');

    // 5. Registro de entrega (alquiler #101 'pendiente' -> pasa a 'activo')
    await encolar<PayloadEntrega>('usr-001', {
      tipo: 'entrega',
      id_alquiler: 101,
      payload: {
        id_alquiler: 101,
        observaciones: 'Entrega completa E2E verificada',
        responsable_nombre: 'Carlos Mendoza',
      },
    });
    const syncEntrega = await sincronizarPendientes('usr-001');
    assert.equal(syncEntrega.confirmadas, 1);

    const detalle101TrasEntrega = await alquileresServiceMock.obtener(101);
    assert.equal(detalle101TrasEntrega.datos?.estado_alquiler, 'activo');

    // 6. Registro de recogida (alquiler #108 'vencido' -> pasa a 'recogido')
    await encolar<PayloadRecogida>('usr-001', {
      tipo: 'recogida',
      id_alquiler: 108,
      payload: {
        id_alquiler: 108,
        observaciones: 'Recogida completa con observación de desgaste menor',
        responsable_nombre: 'Carlos Mendoza',
      },
    });
    const syncRecogida = await sincronizarPendientes('usr-001');
    assert.equal(syncRecogida.confirmadas, 1);

    const detalle108TrasRecogida = await alquileresServiceMock.obtener(108);
    assert.equal(detalle108TrasRecogida.datos?.estado_alquiler, 'recogido');

    // 7. Registro de gastos (con conexión y sin conexión)
    const gastoOnline = await gastosServiceMock.registrar({
      id_usuario: 'usr-001',
      responsable_nombre: 'Carlos Mendoza',
      valor: 92000,
      descripcion: 'Flete combinado entrega #101 y recogida #108',
      asociaciones: [
        { id_alquiler: 101, tipo_movimiento: 'entrega' },
        { id_alquiler: 108, tipo_movimiento: 'recogida' },
      ],
      conectado: true,
    });
    assert.equal(gastoOnline.sincronizadoInmediatamente, true);
    assert.equal(gastoOnline.gasto.estado, 'confirmada');

    // 11. Funcionamiento sin conexión y 13. Cola de operaciones pendientes
    fijarEscenarioSync('sin_conexion');
    const gastoOffline = await gastosServiceMock.registrar({
      id_usuario: 'usr-001',
      responsable_nombre: 'Carlos Mendoza',
      valor: 34000,
      descripcion: 'Peaje registrado sin conexión',
      asociaciones: [{ id_alquiler: 102, tipo_movimiento: 'entrega' }],
      conectado: false,
    });
    assert.equal(gastoOffline.sincronizadoInmediatamente, false);
    assert.equal(gastoOffline.gasto.estado, 'pendiente');

    // 8. Consulta de gastos propios y 9. Resumen semanal
    const misGastos = await gastosServiceMock.listarPropios('usr-001');
    const filtradosPeaje = filtrarGastosPropios(misGastos.datos, 'usr-001', {
      descripcion: 'Peaje registrado sin conexión',
    });
    assert.equal(filtradosPeaje.length, 1);
    assert.equal(filtradosPeaje[0].estado, 'pendiente');

    const resumenSemanal = await gastosServiceMock.obtenerResumenSemanal(
      'usr-001',
      new Date().toISOString().slice(0, 10),
      0
    );
    assert.ok(resumenSemanal.datos.total_pendiente_local >= 34000);

    // 10. Historial de operaciones (incluye entrega, recogida y gastos confirmados y pendientes)
    const historial = await historialServiceMock.listarPropio(
      'usr-001',
      'Carlos Mendoza'
    );
    const pendientesHistorial = filtrarHistorial(historial.datos, {
      estado: 'pendientes',
    });
    assert.ok(
      pendientesHistorial.some((h) => h.detalle_texto === 'Peaje registrado sin conexión')
    );

    // 14. Sincronización simulada y 15. Manejo de errores (3 intentos)
    fijarEscenarioSync('error');
    const syncFallida = await sincronizarPendientes('usr-001');
    assert.equal(syncFallida.errores, 1);

    const colaTrasError = await obtenerNoConfirmadas('usr-001');
    assert.equal(colaTrasError[0].estado, 'error');
    assert.equal(colaTrasError[0].intentos, 3);

    // 16. Cierre de sesión seguro con operaciones pendientes (confirmación expresa de cancelación)
    const canceladasAlCerrar = await cancelarOperacionesPendientesUsuario('usr-001');
    assert.equal(canceladasAlCerrar, 1);
    await eliminarSesion('usr-001');

    const sesionFinal = await restaurarSesionCompleta();
    assert.equal(sesionFinal, null);
    fijarEscenarioSync('ok');
  });
});
