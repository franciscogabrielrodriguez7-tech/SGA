/**
 * Datos simulados de historial de entregas y recogidas — SGA Móvil (§3.5)
 *
 * Incluye entregas y recogidas previas del encargado logístico 'usr-001'
 * y un registro de otro usuario ('usr-002') para verificar el aislamiento RNM-13.
 * Los gastos se unifican dinámicamente desde el repositorio de gastos + cola local.
 */

import type { RegistroHistorial } from '../../types/historial';

export const HISTORIAL_OPERACIONES_INICIAL_MOCK: RegistroHistorial[] = [
  {
    id: 'ent-201',
    tipo: 'entrega',
    fecha: '2026-11-20T09:15:00.000Z',
    id_usuario: 'usr-001',
    responsable_nombre: 'Carlos Mendoza',
    id_alquiler_principal: 103,
    alquileres_relacionados: [
      {
        id_alquiler: 103,
        cliente_nombre: 'Constructora El Roble S.A.S.',
        direccion: 'Cra. 15 # 93-40',
        barrio: 'Chicó',
        tipo_movimiento: 'entrega',
      },
    ],
    detalle_texto: 'Entrega completa recibida en portería de obra. Sin novedades.',
    estado_sincronizacion: 'confirmada',
    es_local_no_confirmado: false,
    origen: 'simulado',
  },
  {
    id: 'ent-202',
    tipo: 'entrega',
    fecha: '2026-11-18T08:10:00.000Z',
    id_usuario: 'usr-001',
    responsable_nombre: 'Carlos Mendoza',
    id_alquiler_principal: 104,
    alquileres_relacionados: [
      {
        id_alquiler: 104,
        cliente_nombre: 'Ingeniería Los Andes Ltda.',
        direccion: 'Av. Suba # 115-20',
        barrio: 'Suba',
        tipo_movimiento: 'entrega',
      },
    ],
    detalle_texto: 'Se entregaron todos los marcos y crucetas en el segundo acceso.',
    estado_sincronizacion: 'confirmada',
    es_local_no_confirmado: false,
    origen: 'simulado',
  },
  {
    id: 'rec-301',
    tipo: 'recogida',
    fecha: '2026-11-19T16:45:00.000Z',
    id_usuario: 'usr-001',
    responsable_nombre: 'Carlos Mendoza',
    id_alquiler_principal: 110,
    alquileres_relacionados: [
      {
        id_alquiler: 110,
        cliente_nombre: 'Obras Civiles del Norte S.A.S.',
        direccion: 'Calle 170 # 45-10',
        barrio: 'Toberín',
        tipo_movimiento: 'recogida',
      },
    ],
    detalle_texto:
      'Recogida completa. Observación: 1 plataforma metálica con abolladura leve en esquina.',
    estado_sincronizacion: 'confirmada',
    es_local_no_confirmado: false,
    origen: 'simulado',
  },
  {
    id: 'rec-302',
    tipo: 'recogida',
    fecha: '2026-11-14T15:30:00.000Z',
    id_usuario: 'usr-001',
    responsable_nombre: 'Carlos Mendoza',
    id_alquiler_principal: 111,
    alquileres_relacionados: [
      {
        id_alquiler: 111,
        cliente_nombre: 'Reformas Integrales Gómez',
        direccion: 'Cra. 68 # 22-85',
        barrio: 'Salitre',
        tipo_movimiento: 'recogida',
      },
    ],
    detalle_texto: 'Equipos recogidos completos y en buen estado.',
    estado_sincronizacion: 'confirmada',
    es_local_no_confirmado: false,
    origen: 'simulado',
  },
  {
    id: 'ent-999-otro-usuario',
    tipo: 'entrega',
    fecha: '2026-11-20T11:00:00.000Z',
    id_usuario: 'usr-002',
    responsable_nombre: 'Ana Ruiz',
    id_alquiler_principal: 105,
    alquileres_relacionados: [
      {
        id_alquiler: 105,
        cliente_nombre: 'Otro Cliente',
        direccion: 'Calle 10 # 10-10',
        barrio: 'Centro',
        tipo_movimiento: 'entrega',
      },
    ],
    detalle_texto: 'Operación de otro usuario (no debe mostrarse a usr-001).',
    estado_sincronizacion: 'confirmada',
    es_local_no_confirmado: false,
    origen: 'simulado',
  },
];
