// Debe coincidir EXACTAMENTE con app/schemas/logistica_alquiler_schema.py
// y app/controllers/logistica_alquiler_controller.py del backend.
// id_usuario_logistico NUNCA va en estos payloads: el backend lo toma
// siempre del JWT (usuario_actual), igual que id_usuario_creador en
// alquileres.

export interface EntregaCreatePayload {
  observaciones_logistica_alquiler?: string;
  valor_gasto_logistico?: number;
  descripcion_gasto_logistico?: string;
}

export interface RecogidaCreatePayload {
  observaciones_logistica_alquiler?: string;
  valor_gasto_logistico?: number;
  descripcion_gasto_logistico?: string;
}

export interface MovimientoLogistico {
  id_logistica_alquiler: number;
  id_alquiler: number;
  id_usuario_logistico: string;
  nombres_logistico: string;
  fecha_gasto: string;
  descripcion_gasto_logistico: string | null;
  valor_gasto_logistico: number;
  observaciones_logistica_alquiler: string | null;
  es_recogida?: boolean;
}

// Un mismo gasto (mismo viaje/valor/fecha) puede corresponder a varios
// alquileres: ids_alquiler acepta 1 o más. El backend registra una
// fila de logistica_alquiler por cada id, todas en una transacción.
export interface GastoCreatePayload {
  ids_alquiler: number[];
  es_recogida: boolean;
  valor_gasto_logistico: number;
  descripcion_gasto_logistico?: string;
  observaciones_logistica_alquiler?: string;
}

export interface ResumenSemanal {
  semana_inicio: string;
  cantidad_registros: number;
  total_gasto: number;
}
