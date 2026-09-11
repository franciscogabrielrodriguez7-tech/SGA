import { apiRequest } from "./client";
import type {
  Cliente,
  ClienteCreatePayload,
  ClienteUpdatePayload,
} from "../interfaces/Cliente";

// Recurso dedicado /clientes (app/routes/cliente_routes.py). NO usar
// /usuarios para clientes: GET/POST/PATCH sobre /usuarios/{id} es
// SOLO_ADMIN en el backend, mientras que /clientes es accesible para
// ADMIN_O_FACTURACION (crear/editar) y STAFF_INTERNO (consultar/listar),
// que es el nivel real que necesita quien crea un alquiler.
export const clientesApi = {
  buscar(busqueda?: string) {
    return apiRequest<Cliente[]>("/clientes", {
      params: { busqueda },
    });
  },

  consultar(idUsuario: string) {
    return apiRequest<Cliente>(`/clientes/${idUsuario}`);
  },

  crear(payload: ClienteCreatePayload) {
    return apiRequest<Pick<Cliente, "id_usuario" | "nombres_usuario" | "apellidos_usuario">>(
      "/clientes",
      {
        method: "POST",
        body: payload,
      },
    );
  },

  actualizar(idUsuario: string, payload: ClienteUpdatePayload) {
    return apiRequest<Cliente>(`/clientes/${idUsuario}`, {
      method: "PATCH",
      body: payload,
    });
  },

  cambiarEstado(idUsuario: string, estadoRegistro: boolean) {
    return apiRequest<{ id_usuario: string; estado_registro: boolean }>(
      `/clientes/${idUsuario}/estado`,
      {
        method: "PATCH",
        body: { estado_registro: estadoRegistro },
      },
    );
  },
};
