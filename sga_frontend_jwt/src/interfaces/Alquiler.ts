// Debe coincidir EXACTAMENTE con app/controllers/alquiler_controller.py
// y app/schemas/alquiler_schema.py del backend.

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
  tiempo_alquiler: number;
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
  id_usuario_creador: string;
  id_usuario_cliente: string;
  barrio: string;
  deposito: number;
  precio_alquiler: number;
  direccion: string;
  fecha_inicio: string; // YYYY-MM-DD
  tiempo_alquiler: number;
  se_lleva: boolean;
  se_recoge: boolean;
  detalles: DetalleAlquilerInlinePayload[];
}

export interface AlquilerUpdatePayload {
  barrio?: string;
  deposito?: number;
  precio_alquiler?: number;
  direccion?: string;
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
