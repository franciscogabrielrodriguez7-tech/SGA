import { apiRequest } from "./client";
import type {
  Alquiler,
  AlquilerCreatePayload,
  AlquilerUpdatePayload,
  DetalleAlquilerLinea,
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

  // Nuevo: GET /alquileres/{id}/detalles — líneas de producto del
  // alquiler (con nombre/precio_base/unidad_minima_alquiler del
  // producto ya incluidos). No existía antes de esta funcionalidad.
  detalles(idAlquiler: number) {
    return apiRequest<DetalleAlquilerLinea[]>(`/alquileres/${idAlquiler}/detalles`);
  },

  // Backend: RenovacionCreate en alquiler_schema.py espera { dias,
  // precio_alquiler? }, no { semanas }. precio_alquiler es opcional:
  // si se envía, reemplaza el precio total del alquiler (ver decisión
  // de negocio: el backend ya no lo recalcula automáticamente). La
  // renovación es una operación ADMIN_O_FACTURACION.
  renovar(idAlquiler: number, dias: number, precioAlquiler?: number) {
    return apiRequest<Alquiler>(`/alquileres/${idAlquiler}/renovaciones`, {
      method: "POST",
      body: { dias, precio_alquiler: precioAlquiler },
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
