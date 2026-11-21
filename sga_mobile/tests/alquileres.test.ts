import assert from "node:assert/strict";
import { test } from "node:test";
import { ALQUILERES_MOCK } from "../src/data/mock/alquileres.ts";
import {
  buscar,
  duracionLegible,
  esProximoAVencer,
  esVisibleEnMovil,
  filtrarPorEstados,
  ordenarPorVencimiento,
  puedeRegistrarEntrega,
  puedeRegistrarRecogida,
  resumenInicio,
} from "../src/domain/alquileres.ts";
import { calcularVencimiento, hoyISO, sumarDias } from "../src/domain/fechas.ts";

const HOY = hoyISO();
const visibles = ALQUILERES_MOCK.filter(esVisibleEnMovil);

test("los alquileres cancelados no son visibles", () => {
  assert.ok(ALQUILERES_MOCK.some((a) => a.estado_alquiler === "cancelado"));
  assert.ok(visibles.every((a) => a.estado_alquiler !== "cancelado"));
  assert.ok(visibles.some((a) => a.estado_alquiler === "recogido")); // no cancelados sí se descargan
});

test("entrega solo para pendientes; recogida solo para activos o vencidos", () => {
  assert.equal(puedeRegistrarEntrega("pendiente"), true);
  for (const e of ["activo", "vencido", "recogido", "terminado", "cancelado"] as const) {
    assert.equal(puedeRegistrarEntrega(e), false, e);
  }
  assert.equal(puedeRegistrarRecogida("activo"), true);
  assert.equal(puedeRegistrarRecogida("vencido"), true);
  for (const e of ["pendiente", "recogido", "terminado", "cancelado"] as const) {
    assert.equal(puedeRegistrarRecogida(e), false, e);
  }
});

test("vencimiento = inicio + (dias - 1)", () => {
  assert.equal(calcularVencimiento("2026-01-01", 7), "2026-01-07");
  assert.equal(calcularVencimiento("2026-01-30", 3), "2026-02-01");
});

test("próximos a vencer: activos con 0 a 2 días", () => {
  const prox = visibles.filter((a) => esProximoAVencer(a, HOY)).map((a) => a.id_alquiler).sort();
  assert.deepEqual(prox, [103, 104, 105, 107]);
  assert.equal(esProximoAVencer({ ...visibles[0], estado_alquiler: "pendiente" }, HOY), false);
});

test("resumen de inicio", () => {
  const r = resumenInicio(ALQUILERES_MOCK, HOY);
  assert.deepEqual(r.vencidos.map((a) => a.id_alquiler), [108, 109]);
  assert.deepEqual(r.pendientesEntrega.map((a) => a.id_alquiler).sort(), [101, 102]);
  assert.equal(r.proximosAVencer.length, 4);
});

test("búsqueda por ID, cliente, dirección y barrio (sin tildes ni mayúsculas)", () => {
  assert.deepEqual(buscar(visibles, "101").map((a) => a.id_alquiler), [101]);
  assert.ok(buscar(visibles, "quintero").every((a) => a.cliente.apellidos_cliente.includes("Quintero")));
  assert.ok(buscar(visibles, "calle 45").some((a) => a.id_alquiler === 101));
  assert.ok(buscar(visibles, "usaquen").some((a) => a.id_alquiler === 103));
  assert.equal(buscar(visibles, "").length, visibles.length);
  assert.equal(buscar(visibles, "zzz").length, 0);
});

test("filtro por estado y orden por vencimiento", () => {
  assert.ok(filtrarPorEstados(visibles, ["vencido"]).every((a) => a.estado_alquiler === "vencido"));
  assert.equal(filtrarPorEstados(visibles, []).length, visibles.length);
  const asc = ordenarPorVencimiento(visibles).map((a) => a.fecha_vencimiento);
  assert.deepEqual(asc, [...asc].sort());
  const desc = ordenarPorVencimiento(visibles, false).map((a) => a.fecha_vencimiento);
  assert.deepEqual(desc, [...desc].sort().reverse());
});

test("duración en días o semanas", () => {
  assert.equal(duracionLegible(14), "2 semanas (14 días)");
  assert.equal(duracionLegible(5), "5 días");
});

test("datos simulados coherentes: vencimiento consistente con duración", () => {
  for (const a of ALQUILERES_MOCK) {
    assert.equal(a.fecha_vencimiento, sumarDias(a.fecha_inicio, a.tiempo_alquiler_dias - 1), String(a.id_alquiler));
  }
});
