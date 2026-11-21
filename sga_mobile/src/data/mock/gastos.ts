/**
 * Datos simulados de gastos — SGA Móvil (§3.3 y §3.4)
 *
 * Escenarios representados:
 * - Gastos del encargado logístico principal ('usr-001', Carlos Mendoza).
 * - Gasto con múltiples alquileres asociados (RNM-10).
 * - Gasto donde se repite el mismo alquiler con tipos de movimiento distintos:
 *   'entrega' y 'recogida' (RNM-11).
 * - Gastos en la semana actual (2026-11-16 a 2026-11-22) y en semanas anteriores.
 * - Gastos confirmados y gastos locales pendientes de sincronización.
 * - Gasto de otro usuario ('usr-002') que NO debe aparecer para 'usr-001' (RNM-13).
 */

import type { GastoLogistico } from '../../types/gastos';

export const GASTOS_INICIALES_MOCK: GastoLogistico[] = [
  {
    id: 'gas-101',
    id_usuario: 'usr-001',
    responsable_nombre: 'Carlos Mendoza',
    descripcion: 'Transporte y peaje ruta norte (entrega #101 y recogida #108)',
    valor: 85000,
    fecha: '2026-11-21T08:30:00.000Z',
    estado: 'confirmada',
    origen: 'simulado',
    asociaciones: [
      { id_alquiler: 101, tipo_movimiento: 'entrega' },
      { id_alquiler: 108, tipo_movimiento: 'recogida' },
    ],
  },
  {
    id: 'gas-102',
    id_usuario: 'usr-001',
    responsable_nombre: 'Carlos Mendoza',
    descripcion: 'Combustible desplazamiento entrega y recogida en misma obra #103',
    valor: 54000,
    fecha: '2026-11-20T14:15:00.000Z',
    estado: 'confirmada',
    origen: 'simulado',
    // Caso RNM-11: mismo alquiler #103 repetido con tipos de movimiento distintos
    asociaciones: [
      { id_alquiler: 103, tipo_movimiento: 'entrega' },
      { id_alquiler: 103, tipo_movimiento: 'recogida' },
    ],
  },
  {
    id: 'gas-103',
    id_usuario: 'usr-001',
    responsable_nombre: 'Carlos Mendoza',
    descripcion: 'Auxiliar de descargue para entrega de tableros metálicos',
    valor: 60000,
    fecha: '2026-11-18T11:00:00.000Z',
    estado: 'confirmada',
    origen: 'simulado',
    asociaciones: [
      { id_alquiler: 104, tipo_movimiento: 'entrega' },
      { id_alquiler: 105, tipo_movimiento: 'entrega' },
    ],
  },
  {
    id: 'gas-104',
    id_usuario: 'usr-001',
    responsable_nombre: 'Carlos Mendoza',
    descripcion: 'Parqueadero y amarre de carga en recogida urgente',
    valor: 28000,
    fecha: '2026-11-21T10:05:00.000Z',
    estado: 'pendiente',
    origen: 'local',
    asociaciones: [{ id_alquiler: 109, tipo_movimiento: 'recogida' }],
  },
  {
    id: 'gas-105',
    id_usuario: 'usr-001',
    responsable_nombre: 'Carlos Mendoza',
    descripcion: 'Flete camión semana anterior — entregas zona industrial',
    valor: 110000,
    fecha: '2026-11-12T09:40:00.000Z', // Semana anterior (Lun 09/11 a Dom 15/11)
    estado: 'confirmada',
    origen: 'simulado',
    asociaciones: [
      { id_alquiler: 106, tipo_movimiento: 'entrega' },
      { id_alquiler: 107, tipo_movimiento: 'entrega' },
    ],
  },
  {
    id: 'gas-106',
    id_usuario: 'usr-001',
    responsable_nombre: 'Carlos Mendoza',
    descripcion: 'Recogida final de andamios certificados #110 y #111',
    valor: 75000,
    fecha: '2026-11-14T16:20:00.000Z', // Semana anterior (Lun 09/11 a Dom 15/11)
    estado: 'confirmada',
    origen: 'simulado',
    asociaciones: [
      { id_alquiler: 110, tipo_movimiento: 'recogida' },
      { id_alquiler: 111, tipo_movimiento: 'recogida' },
    ],
  },
  {
    id: 'gas-999-otro-usuario',
    id_usuario: 'usr-002',
    responsable_nombre: 'Ana Ruiz',
    descripcion: 'Gasto de otro encargado logístico (no debe mostrarse a usr-001)',
    valor: 99000,
    fecha: '2026-11-20T12:00:00.000Z',
    estado: 'confirmada',
    origen: 'simulado',
    asociaciones: [{ id_alquiler: 102, tipo_movimiento: 'entrega' }],
  },
];

export const GASTOS_MOCK = GASTOS_INICIALES_MOCK;
