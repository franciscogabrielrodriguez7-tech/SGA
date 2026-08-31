// Debe coincidir EXACTAMENTE con app/schemas/logistica_alquiler_schema.py
// y app/controllers/logistica_alquiler_controller.py del backend.

export interface EntregaCreatePayload {
  id_usuario_logistico: string;
  observaciones_logistica_alquiler?: string;
  valor_gasto_logistico?: number;
  descripcion_gasto_logistico?: string;
}

export interface RecogidaCreatePayload {
  id_usuario_logistico: string;
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

export interface GastoCreatePayload {
  id_alquiler: number;
  id_usuario_logistico: string;
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
