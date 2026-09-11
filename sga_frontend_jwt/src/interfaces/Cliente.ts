// Debe coincidir EXACTAMENTE con app/schemas/cliente_schema.py y
// app/controllers/cliente_controller.py (SELECT_CLIENTE_CAMPOS) del
// backend. Los clientes son usuario.rol_usuario = 'cliente' pero se
// gestionan por el recurso dedicado /clientes (no /usuarios): ese
// recurso es accesible para ADMIN_O_FACTURACION (crear/editar) y
// STAFF_INTERNO (consultar/listar), mientras que /usuarios/{id} es
// SOLO_ADMIN. Usar /usuarios para clientes le negaria el acceso a
// encargado_facturacion, que si puede crear alquileres.
export type TipoDocumento = "CC" | "CE" | "NIT" | "PPT";

export interface Cliente {
  id_usuario: string;
  tipo_documento: TipoDocumento;
  nombres_usuario: string;
  apellidos_usuario: string;
  telefono_usuario: string;
  email_usuario?: string | null;
  estado_registro?: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface ClienteCreatePayload {
  id_usuario: string;
  tipo_documento: TipoDocumento;
  nombres_usuario: string;
  apellidos_usuario: string;
  telefono_usuario: string;
  email_usuario?: string | null;
}

export interface ClienteUpdatePayload {
  nombres_usuario?: string;
  apellidos_usuario?: string;
  telefono_usuario?: string;
  email_usuario?: string | null;
}
