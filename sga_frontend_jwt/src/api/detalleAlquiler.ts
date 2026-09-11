import { apiRequest } from "./client";
import type { DetalleAlquilerBackend } from "../interfaces/Alquiler";

export interface DetalleAlquilerCreatePayload {
  id_alquiler: number;
  id_producto: number;
  cantidad_productos: number;
  precio_conjunto: number;
  es_producto_extra?: boolean;
}

export interface DetalleAlquilerUpdatePayload {
  cantidad_productos?: number;
  precio_conjunto?: number;
}

export const detalleAlquilerApi = {
  crear(payload: DetalleAlquilerCreatePayload) {
    return apiRequest<{
      id_detalle_alquiler: number;
      id_alquiler: number;
      id_producto: number;
      cantidad_productos: number;
    }>("/detalle-alquiler", {
      method: "POST",
      body: payload,
    });
  },

  consultar(idDetalleAlquiler: number) {
    return apiRequest<DetalleAlquilerBackend & { id_alquiler: number; fecha_creacion: string; fecha_actualizacion: string }>(
      `/detalle-alquiler/${idDetalleAlquiler}`,
    );
  },

  actualizar(idDetalleAlquiler: number, payload: DetalleAlquilerUpdatePayload) {
    return apiRequest<DetalleAlquilerBackend>(`/detalle-alquiler/${idDetalleAlquiler}`, {
      method: "PATCH",
      body: payload,
    });
  },
};
