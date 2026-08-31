import { apiRequest } from "./client";
import type {
  GastoCreatePayload,
  MovimientoLogistico,
  ResumenSemanal,
} from "../interfaces/Logistica";

export const gastosApi = {
  crear(payload: GastoCreatePayload) {
    return apiRequest<{
      id_logistica_alquiler: number;
      id_alquiler: number;
      valor_gasto_logistico: number;
      es_recogida: boolean;
    }>("/gastos", {
      method: "POST",
      body: payload,
    });
  },

  listar(idAlquiler?: number) {
    return apiRequest<MovimientoLogistico[]>("/gastos", {
      params: { id_alquiler: idAlquiler },
    });
  },

  resumenSemanal() {
    return apiRequest<ResumenSemanal[]>("/gastos/resumen-semanal");
  },
};
