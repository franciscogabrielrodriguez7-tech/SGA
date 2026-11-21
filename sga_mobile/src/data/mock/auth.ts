/**
 * Datos simulados de autenticación — SGA Móvil
 *
 * ADVERTENCIA: Estas credenciales son únicamente para desarrollo con mock data.
 * No contienen contraseñas reales ni tokens válidos de producción.
 * No sustituir por datos reales en este archivo.
 */

import type { SesionUsuario } from '../../types/auth';

/** Duración simulada del token en ms (30 minutos) */
export const DURACION_TOKEN_MS = 30 * 60 * 1000;

/**
 * Tiempo de desplazamiento para simular expiración anticipada.
 * -1 significa sin expiración anticipada.
 * Cambiar a un valor positivo (ms) para disparar el escenario de token expirado.
 */
export let OFFSET_EXPIRACION_MS = -1;

export function fijarOffsetExpiracion(ms: number): void {
  OFFSET_EXPIRACION_MS = ms;
}

/** Genera una fecha de expiración desde ahora */
function calcularExpiracion(): string {
  const ahora = Date.now();
  const offset = OFFSET_EXPIRACION_MS > 0 ? -OFFSET_EXPIRACION_MS : 0;
  return new Date(ahora + DURACION_TOKEN_MS + offset).toISOString();
}

/** Credenciales de acceso válidas en entorno mock */
const CREDENCIALES_MOCK: Array<{
  identificador: string;
  telefono: string;
  contrasena: string;
  sesion: Omit<SesionUsuario, 'token' | 'expiraEn'>;
  deshabilitado?: boolean;
}> = [
  {
    identificador: 'logistico1',
    telefono: '3001234567',
    contrasena: 'demo123',
    sesion: {
      id_usuario: 'usr-001',
      nombres: 'Carlos',
      apellidos: 'Mendoza',
      rol: 'ENCARGADO_LOGISTICO',
    },
  },
  {
    identificador: 'logistico_bloqueado',
    telefono: '3009999999',
    contrasena: 'demo456',
    deshabilitado: true,
    sesion: {
      id_usuario: 'usr-002',
      nombres: 'Ana',
      apellidos: 'Ruiz',
      rol: 'ENCARGADO_LOGISTICO',
    },
  },
];

/** Genera un token simulado (no es un JWT real) */
function generarToken(id_usuario: string): string {
  return `mock-token-${id_usuario}-${Date.now()}`;
}

/**
 * Verifica las credenciales y retorna la sesión si son válidas.
 * @returns SesionUsuario si es válido, null si no coincide, 'deshabilitado' si está bloqueado.
 */
export function verificarCredenciales(
  identificador: string,
  contrasena: string
): SesionUsuario | null | 'deshabilitado' {
  const entrada = CREDENCIALES_MOCK.find(
    (c) =>
      (c.identificador === identificador.trim() || c.telefono === identificador.trim()) &&
      c.contrasena === contrasena
  );

  if (!entrada) return null;
  if (entrada.deshabilitado) return 'deshabilitado';

  return {
    ...entrada.sesion,
    token: generarToken(entrada.sesion.id_usuario),
    expiraEn: calcularExpiracion(),
  };
}

/** Verifica si una sesión existente tiene token expirado */
export function estaExpirada(sesion: SesionUsuario): boolean {
  return new Date(sesion.expiraEn).getTime() < Date.now();
}

/** Renueva simuladamente una sesión (biométrico — sin contraseña) */
export function renovarSesion(sesion: SesionUsuario): SesionUsuario {
  return {
    ...sesion,
    token: generarToken(sesion.id_usuario),
    expiraEn: calcularExpiracion(),
  };
}
