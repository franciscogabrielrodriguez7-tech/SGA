// Modelos del módulo móvil.
// Los nombres de campo siguen el contrato ya usado por el SGA web
// (sga_frontend_jwt/src/interfaces/*). No se inventan campos del backend.
// Se OMITEN deliberadamente los campos del empleado creador (HU-03 CA-9).

export type EstadoAlquiler =
  | "pendiente"
  | "activo"
  | "vencido"
  | "recogido"
  | "terminado"
  | "cancelado";

export type UnidadMinimaAlquiler = "DIA" | "SEMANA" | "MES";

export interface DetalleAlquiler {
  id_detalle_alquiler: number;
  id_producto: number;
  nombre_producto: string;
  cantidad_productos: number;
  precio_base_producto: number; // por unidad de tiempo (unidad mínima)
  unidad_minima_alquiler: UnidadMinimaAlquiler;
  precio_conjunto: number;
  es_producto_extra: boolean;
}

// DEPENDENCIA PENDIENTE (DEP-INT-01): el teléfono y el tipo de documento del
// cliente no vienen en la respuesta de /alquileres; requieren /clientes.
export interface ClienteResumen {
  id_usuario_cliente: string; // número de documento
  tipo_documento: string;
  nombres_cliente: string;
  apellidos_cliente: string;
  telefono_usuario: string;
}

export interface Alquiler {
  id_alquiler: number;
  estado_alquiler: EstadoAlquiler;
  barrio: string;
  direccion: string;
  deposito: number;
  precio_alquiler: number;
  fecha_inicio: string; // YYYY-MM-DD
  tiempo_alquiler_dias: number;
  fecha_vencimiento: string; // YYYY-MM-DD
  se_lleva: boolean;
  se_recoge: boolean;
  cliente: ClienteResumen;
  detalles: DetalleAlquiler[];
}

// Origen de los datos mostrados. Nunca se presenta un dato local o simulado
// como confirmado por el servidor.
export type OrigenDatos = "simulado" | "local" | "servidor";

export interface Resultado<T> {
  datos: T;
  origen: OrigenDatos;
  actualizadoEn: string; // ISO; permite indicar datos desactualizados
}
