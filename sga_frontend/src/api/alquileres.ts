import { apiRequest } from "./client";
import type {
  Alquiler,
  AlquilerCreatePayload,
  AlquilerUpdatePayload,
  EstadoAlquiler,
  HistorialAlquiler,
} from "../interfaces/Alquiler";
import type {
  EntregaCreatePayload,
  MovimientoLogistico,
  RecogidaCreatePayload,
} from "../interfaces/Logistica";

export const alquileresApi = {
  crear(payload: AlquilerCreatePayload) {
    return apiRequest<Alquiler>("/alquileres", {
      method: "POST",
      body: payload,
    });
  },

  listar(filtros?: { estado_alquiler?: EstadoAlquiler; id_usuario_cliente?: string }) {
    return apiRequest<Alquiler[]>("/alquileres", {
      params: filtros,
    });
  },

  consultar(idAlquiler: number) {
    return apiRequest<Alquiler>(`/alquileres/${idAlquiler}`);
  },

  actualizar(idAlquiler: number, payload: AlquilerUpdatePayload) {
    return apiRequest<Alquiler>(`/alquileres/${idAlquiler}`, {
      method: "PATCH",
      body: payload,
    });
  },

  cambiarEstado(idAlquiler: number, estadoAlquiler: EstadoAlquiler) {
    return apiRequest<Alquiler>(`/alquileres/${idAlquiler}/estado`, {
      method: "PATCH",
      body: { estado_alquiler: estadoAlquiler },
    });
  },

  cancelar(idAlquiler: number) {
    return apiRequest<Alquiler>(`/alquileres/${idAlquiler}`, {
      method: "DELETE",
    });
  },

  buscar(filtros: { cliente?: string; barrio?: string; id_detalle?: number }) {
    return apiRequest<Alquiler[]>("/alquileres/buscar", {
      params: filtros,
    });
  },

  proximosAVencer(dias = 2) {
    return apiRequest<Alquiler[]>("/alquileres/proximos-vencer", {
      params: { dias },
    });
  },

  pendientesEntrega() {
    return apiRequest<Alquiler[]>("/alquileres/pendientes-entrega");
  },

  historial(idAlquiler: number) {
    return apiRequest<HistorialAlquiler>(`/alquileres/${idAlquiler}/historial`);
  },

  renovar(idAlquiler: number, semanas: number) {
    return apiRequest<Alquiler>(`/alquileres/${idAlquiler}/renovaciones`, {
      method: "POST",
      body: { semanas },
    });
  },

  registrarEntrega(idAlquiler: number, payload: EntregaCreatePayload) {
    return apiRequest<{ id_logistica_alquiler: number; id_alquiler: number; es_recogida: boolean }>(
      `/alquileres/${idAlquiler}/entregas`,
      {
        method: "POST",
        body: payload,
      },
    );
  },

  listarEntregas(idAlquiler: number) {
    return apiRequest<MovimientoLogistico[]>(`/alquileres/${idAlquiler}/entregas`);
  },

  registrarRecogida(idAlquiler: number, payload: RecogidaCreatePayload) {
    return apiRequest<{ id_logistica_alquiler: number; id_alquiler: number; es_recogida: boolean }>(
      `/alquileres/${idAlquiler}/recogidas`,
      {
        method: "POST",
        body: payload,
      },
    );
  },

  listarRecogidas(idAlquiler: number) {
    return apiRequest<MovimientoLogistico[]>(`/alquileres/${idAlquiler}/recogidas`);
  },
};
