// Espejo EXACTO de app/utils/roles.py del backend. El frontend NO
// decide permisos por su cuenta: solo oculta/deshabilita lo que el
// backend rechazaría de todas formas (403), para dar mejor UX. La
// autoridad real sigue siendo `requiere_rol(...)` en cada endpoint.
//
// JERARQUÍA: admin > encargado_facturacion > encargado_logistico.
// 'cliente' nunca aparece en ningún grupo: no es actor de la app web.
import type { RolUsuario } from "../interfaces/Usuario";

export const SOLO_ADMIN: RolUsuario[] = ["admin"];

export const ADMIN_O_FACTURACION: RolUsuario[] = ["admin", "encargado_facturacion"];

export const STAFF_INTERNO: RolUsuario[] = [
  "admin",
  "encargado_facturacion",
  "encargado_logistico",
];

export function tienePermiso(
  rol: RolUsuario | null | undefined,
  rolesPermitidos: RolUsuario[],
): boolean {
  if (!rol) return false;
  return rolesPermitidos.includes(rol);
}
