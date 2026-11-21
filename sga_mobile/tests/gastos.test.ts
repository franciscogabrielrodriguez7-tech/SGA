/**
 * Pruebas unitarias de reglas de negocio de Gastos y Resumen Semanal — SGA Móvil (§3.3 y §3.4)
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ALQUILERES_MOCK } from '../src/data/mock/alquileres.ts';
import { GASTOS_INICIALES_MOCK } from '../src/data/mock/gastos.ts';
import {
  agregarAsociacionGasto,
  buscarAlquileresPorIdOCliente,
  calcularResumenSemanalGastos,
  filtrarGastosPropios,
  modificarTipoMovimientoAsociacion,
  obtenerRangoSemanaLunesADomingo,
  parsearValorPositivo,
  quitarAsociacionGasto,
  validarRegistroGasto,
} from '../src/domain/gastos.ts';
import type { AsociacionGasto, GastoLogistico } from '../src/types/gastos.ts';

describe('Gastos — Validación de valor, descripción y asociaciones (§3.3)', () => {
  it('exige valor estrictamente positivo (> 0) y rechaza cero o negativos (RNM-09)', () => {
    assert.equal(parsearValorPositivo('0'), null);
    assert.equal(parsearValorPositivo('-5000'), null);
    assert.equal(parsearValorPositivo('abc'), null);
    assert.equal(parsearValorPositivo(''), null);
    assert.equal(parsearValorPositivo('85000'), 85000);
    assert.equal(parsearValorPositivo('$ 85.000'), 85000);
  });

  it('exige descripción y al menos un alquiler relacionado (RNM-09)', () => {
    const sinDesc = validarRegistroGasto({
      valorTexto: '45000',
      descripcion: '   ',
      asociaciones: [{ id_alquiler: 101, tipo_movimiento: 'entrega' }],
    });
    assert.equal(sinDesc.ok, false);

    const sinAlquileres = validarRegistroGasto({
      valorTexto: '45000',
      descripcion: 'Peaje autopista norte',
      asociaciones: [],
    });
    assert.equal(sinAlquileres.ok, false);
  });

  it('permite repetir el mismo alquiler únicamente cuando los tipos de movimiento son diferentes (RNM-10 y RNM-11)', () => {
    let lista: AsociacionGasto[] = [];

    // 1. Agregar alquiler #101 con 'entrega' -> OK
    const paso1 = agregarAsociacionGasto(lista, {
      id_alquiler: 101,
      tipo_movimiento: 'entrega',
    });
    assert.equal(paso1.ok, true);
    if (paso1.ok) lista = paso1.asociaciones;

    // 2. Intentar repetir alquiler #101 con el mismo tipo 'entrega' -> RECHAZADO
    const duplicadoMismoTipo = agregarAsociacionGasto(lista, {
      id_alquiler: 101,
      tipo_movimiento: 'entrega',
    });
    assert.equal(duplicadoMismoTipo.ok, false);

    // 3. Repetir alquiler #101 con tipo distinto 'recogida' -> PERMITIDO
    const distintoTipo = agregarAsociacionGasto(lista, {
      id_alquiler: 101,
      tipo_movimiento: 'recogida',
    });
    assert.equal(distintoTipo.ok, true);
    if (distintoTipo.ok) lista = distintoTipo.asociaciones;
    assert.equal(lista.length, 2);
  });

  it('permite modificar el tipo de movimiento y quitar asociaciones, impidiendo colisiones', () => {
    const inicial: AsociacionGasto[] = [
      { id_alquiler: 101, tipo_movimiento: 'entrega' },
      { id_alquiler: 102, tipo_movimiento: 'entrega' },
    ];

    // Cambiar #102 de 'entrega' a 'recogida' -> OK
    const cambioOk = modificarTipoMovimientoAsociacion(inicial, 1, 'recogida');
    assert.equal(cambioOk.ok, true);
    if (cambioOk.ok) {
      assert.equal(cambioOk.asociaciones[1].tipo_movimiento, 'recogida');
    }

    // Si un alquiler ya tiene ambos tipos, intentar cambiar uno al otro debe fallar
    const ambosTipos: AsociacionGasto[] = [
      { id_alquiler: 101, tipo_movimiento: 'entrega' },
      { id_alquiler: 101, tipo_movimiento: 'recogida' },
    ];
    const colision = modificarTipoMovimientoAsociacion(ambosTipos, 0, 'recogida');
    assert.equal(colision.ok, false);

    // Quitar asociación
    const trasQuitar = quitarAsociacionGasto(ambosTipos, 0);
    assert.equal(trasQuitar.length, 1);
    assert.equal(trasQuitar[0].tipo_movimiento, 'recogida');
  });

  it('busca alquileres por ID o cliente excluyendo cancelados', () => {
    const porId = buscarAlquileresPorIdOCliente(ALQUILERES_MOCK, '101');
    assert.ok(porId.some((a) => a.id_alquiler === 101));

    // Alquileres cancelados (112, 113) nunca deben aparecer
    const cancelado = buscarAlquileresPorIdOCliente(ALQUILERES_MOCK, '112');
    assert.equal(cancelado.length, 0);
  });
});

describe('Gastos — Consulta propia, filtros y Resumen Semanal lunes a domingo (§3.4)', () => {
  it('muestra únicamente los gastos del encargado logístico autenticado y aplica filtros', () => {
    const propios = filtrarGastosPropios(GASTOS_INICIALES_MOCK, 'usr-001');
    assert.ok(propios.length > 0);
    assert.ok(propios.every((g) => g.id_usuario === 'usr-001'));
    assert.ok(!propios.some((g) => g.id === 'gas-999-otro-usuario'));

    // Filtro por día
    const del21 = filtrarGastosPropios(GASTOS_INICIALES_MOCK, 'usr-001', {
      dia: '2026-11-21',
    });
    assert.ok(del21.length >= 2);
    assert.ok(del21.every((g) => g.fecha.startsWith('2026-11-21')));

    // Filtro por descripción
    const peaje = filtrarGastosPropios(GASTOS_INICIALES_MOCK, 'usr-001', {
      descripcion: 'peaje',
    });
    assert.equal(peaje.length, 1);
    assert.equal(peaje[0].id, 'gas-101');

    // Filtro por valor mínimo y máximo
    const rango = filtrarGastosPropios(GASTOS_INICIALES_MOCK, 'usr-001', {
      valorMin: 50000,
      valorMax: 65000,
    });
    assert.ok(rango.every((g) => g.valor >= 50000 && g.valor <= 65000));
  });

  it('calcula el rango de lunes a domingo y permite consultar semanas anteriores', () => {
    // 2026-11-21 es sábado -> semana del lunes 2026-11-16 al domingo 2026-11-22
    const actual = obtenerRangoSemanaLunesADomingo('2026-11-21', 0);
    assert.equal(actual.lunes, '2026-11-16');
    assert.equal(actual.domingo, '2026-11-22');

    const anterior = obtenerRangoSemanaLunesADomingo('2026-11-21', -1);
    assert.equal(anterior.lunes, '2026-11-09');
    assert.equal(anterior.domingo, '2026-11-15');
  });

  it('no multiplica el valor del gasto por el número de asociaciones y distingue confirmados de pendientes', () => {
    const gastosPrueba: GastoLogistico[] = [
      {
        id: 'g-multiasoc',
        id_usuario: 'usr-001',
        responsable_nombre: 'Carlos Mendoza',
        descripcion: 'Flete compartido 3 alquileres',
        valor: 70000, // Valor global
        fecha: '2026-11-20T10:00:00.000Z',
        estado: 'confirmada',
        origen: 'simulado',
        asociaciones: [
          { id_alquiler: 101, tipo_movimiento: 'entrega' },
          { id_alquiler: 102, tipo_movimiento: 'entrega' },
          { id_alquiler: 108, tipo_movimiento: 'recogida' },
        ],
      },
      {
        id: 'g-pendiente',
        id_usuario: 'usr-001',
        responsable_nombre: 'Carlos Mendoza',
        descripcion: 'Gasto offline pendiente',
        valor: 35000,
        fecha: '2026-11-21T12:00:00.000Z',
        estado: 'pendiente',
        origen: 'local',
        asociaciones: [{ id_alquiler: 103, tipo_movimiento: 'recogida' }],
      },
    ];

    const resumen = calcularResumenSemanalGastos(
      gastosPrueba,
      'usr-001',
      '2026-11-21',
      0
    );

    // El total debe ser 70000 + 35000 = 105000 (NO 70000*3 + 35000)
    assert.equal(resumen.total, 105000);
    assert.equal(resumen.total_confirmado, 70000);
    assert.equal(resumen.total_pendiente_local, 35000);
    assert.equal(resumen.cantidad_confirmados, 1);
    assert.equal(resumen.cantidad_pendientes_locales, 1);
    assert.equal(resumen.promedio_diario, 15000); // 105000 / 7
  });
});
