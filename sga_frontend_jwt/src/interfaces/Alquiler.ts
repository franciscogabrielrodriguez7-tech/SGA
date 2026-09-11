// Debe coincidir EXACTAMENTE con app/controllers/alquiler_controller.py
// y app/schemas/alquiler_schema.py del backend.

import type { UnidadMinimaAlquiler } from "./Producto";

export type EstadoAlquiler =
  | "pendiente"
  | "activo"
  | "vencido"
  | "recogido"
  | "terminado"
  | "cancelado";

export const ESTADOS_ALQUILER: EstadoAlquiler[] = [
  "pendiente",
  "activo",
  "vencido",
  "recogido",
  "terminado",
  "cancelado",
];

// Línea de detalle tal como la devuelve el backend anidada en un alquiler
// (ver _obtener_detalles en alquiler_controller.py)
export interface DetalleAlquilerBackend {
  id_detalle_alquiler: number;
  id_producto: number;
  nombre_producto: string;
  cantidad_productos: number;
  precio_conjunto: number;
  es_producto_extra: boolean;
  estado_registro: boolean;
}

export interface Alquiler {
  id_alquiler: number;
  estado_alquiler: EstadoAlquiler;
  barrio: string;
  direccion: string;
  deposito: number;
  precio_alquiler: number;
  fecha_inicio: string;
  tiempo_alquiler_dias: number;
  fecha_vencimiento: string;
  se_lleva: boolean;
  se_recoge: boolean;
  estado_registro: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  id_usuario_creador: string;
  nombres_creador: string;
  apellidos_creador: string;
  id_usuario_cliente: string;
  nombres_cliente: string;
  apellidos_cliente: string;
  detalles: DetalleAlquilerBackend[];
}

// Línea enviada dentro del payload de creación (AlquilerCreate.detalles
// en el backend, min_length=1 — RN-ALQ-03 se garantiza en el backend
// insertando todo en una sola transacción).
export interface DetalleAlquilerInlinePayload {
  id_producto: number;
  cantidad_productos: number;
  precio_conjunto: number;
  es_producto_extra?: boolean;
}

export interface AlquilerCreatePayload {
  // NO incluir id_usuario_creador: el backend (AlquilerCreate en
  // alquiler_schema.py) lo toma SIEMPRE del JWT (usuario_actual), nunca
  // del payload. Enviarlo aquí sería un campo ignorado/engañoso.
  id_usuario_cliente: string;
  barrio: string;
  deposito: number;
  precio_alquiler: number;
  direccion: string;
  fecha_inicio: string; // YYYY-MM-DD
  tiempo_alquiler_dias: number;
  se_lleva: boolean;
  se_recoge: boolean;
  detalles: DetalleAlquilerInlinePayload[];
}

export interface AlquilerUpdatePayload {
  barrio?: string;
  deposito?: number;
  precio_alquiler?: number;
  direccion?: string;
  fecha_inicio?: string;
  tiempo_alquiler_dias?: number;
  se_lleva?: boolean;
  se_recoge?: boolean;
}

export interface HistorialAlquiler {
  id_alquiler: number;
  estado_actual: EstadoAlquiler;
  fecha_creacion: string;
  fecha_ultima_actualizacion: string;
  historial_completo_disponible: false;
  nota: string;
}

// Corresponde a GET /alquileres/{id}/detalles
// (listar_detalles_por_alquiler en detalle_alquiler_controller.py).
export interface DetalleAlquilerLinea {
  id_detalle_alquiler: number;
  id_alquiler: number;
  id_producto: number;
  nombre_producto: string;
  precio_base_producto: number;
  unidad_minima_alquiler: UnidadMinimaAlquiler;
  cantidad_productos: number;
  precio_conjunto: number;
  es_producto_extra: boolean;
  estado_registro: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}
