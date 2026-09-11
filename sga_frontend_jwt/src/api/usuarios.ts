import { apiRequest } from "./client";
import type {
  Usuario,
  UsuarioCreatePayload,
} from "../interfaces/Usuario";

export const usuariosApi = {  crear(payload: UsuarioCreatePayload) {
    return apiRequest<Pick<Usuario, "id_usuario" | "rol_usuario" | "nombres_usuario" | "apellidos_usuario">>(
      "/usuarios",
      {
        method: "POST",
        body: payload,
      },
    );
  },

  listar(rolUsuario?: string) {
    return apiRequest<Usuario[]>("/usuarios", {
      params: { rol_usuario: rolUsuario },
    });
  },

  consultar(idUsuario: string) {
    return apiRequest<Usuario>(`/usuarios/${idUsuario}`);
  },

  cambiarEstado(idUsuario: string, estadoUsuario: boolean) {
    return apiRequest<{ id_usuario: string; estado_usuario: boolean }>(
      `/usuarios/${idUsuario}/estado`,
      {
        method: "PATCH",
        body: { estado_usuario: estadoUsuario },
      },
    );
  },
};
