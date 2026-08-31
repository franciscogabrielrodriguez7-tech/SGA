// Debe coincidir EXACTAMENTE con app/schemas/usuario_schema.py y
// app/controllers/usuario_controller.py del backend.

export type TipoDocumento = "CC" | "CE" | "NIT" | "PPT";

export type RolUsuario =
  | "admin"
  | "encargado_facturacion"
  | "encargado_logistico"
  | "cliente";

export interface Usuario {
  id_usuario: string;
  rol_usuario: RolUsuario;
  nombres_usuario: string;
  apellidos_usuario: string;
  email_usuario: string | null;
  telefono_usuario: string;
  tipo_documento: TipoDocumento;
  fecha_creacion: string;
  fecha_actualizacion?: string;
  estado_usuario: boolean;
}

export interface UsuarioCreatePayload {
  id_usuario: string;
  rol_usuario: RolUsuario;
  nombres_usuario: string;
  apellidos_usuario: string;
  email_usuario?: string | null;
  telefono_usuario: string;
  contrasena_usuario?: string | null;
  tipo_documento: TipoDocumento;
}

export interface LoginPayload {
  telefono_usuario?: string;
  email_usuario?: string;
  contrasena_usuario: string;
}

// Respuesta de POST /usuarios/login (el backend NO emite JWT; ver README).
export interface LoginResponse {
  logueado: boolean;
  id_usuario: string;
  rol_usuario: RolUsuario;
  nombres_usuario: string;
  apellidos_usuario: string;
  // NUEVO en la variante con JWT (no existe en la variante sin JWT)
  access_token: string;
  token_type: string;
}
