/**
 * Adaptador mock del servicio de autenticación — SGA Móvil (§3.1 y §3.2)
 *
 * Simula:
 * - Login exitoso por usuario o teléfono + contraseña
 * - Credenciales incorrectas
 * - Usuario deshabilitado
 * - Sin conexión (no se permite login inicial offline)
 * - Persistencia de sesión al cerrar y volver a abrir la app mientras el token sea válido
 * - Acceso biométrico en aperturas posteriores con sesión vigente (RNM-02),
 *   sin inventar renovación de tokens cuando el token ha expirado (§3.2 / P-02)
 */

import {
  estaExpirada,
  verificarCredenciales,
} from '../../data/mock/auth.ts';
import {
  eliminarSesion,
  guardarSesion,
  obtenerSesionMemoria,
  restaurarSesionCompleta,
} from '../../storage/sesion.ts';
import type { ResultadoLogin, SesionUsuario } from '../../types/auth.ts';
import type { AuthService } from '../AuthService.ts';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let _simularSinConexion = false;

export function simularSinConexion(valor: boolean): void {
  _simularSinConexion = valor;
}

export function estaSimulandoSinConexionAuth(): boolean {
  return _simularSinConexion;
}

export const authServiceMock: AuthService = {
  async login(identificador, contrasena): Promise<ResultadoLogin> {
    await delay(300);

    if (_simularSinConexion) {
      return { ok: false, error: 'sin_conexion' };
    }

    const resultado = verificarCredenciales(identificador, contrasena);

    if (resultado === null) {
      return { ok: false, error: 'credenciales_invalidas' };
    }
    if (resultado === 'deshabilitado') {
      return { ok: false, error: 'usuario_deshabilitado' };
    }

    await guardarSesion(resultado);
    return { ok: true, sesion: resultado };
  },

  async cerrarSesion(id_usuario?: string): Promise<void> {
    await delay(120);
    await eliminarSesion(id_usuario);
  },

  async obtenerSesionActual(): Promise<SesionUsuario | null> {
    const enMemoria = obtenerSesionMemoria();
    if (enMemoria) return enMemoria;

    // Restaura sesión completa (perfil + token) desde almacenamiento persistente
    const restaurada = await restaurarSesionCompleta();
    return restaurada;
  },

  async renovarBiometrico(): Promise<ResultadoLogin> {
    await delay(250);

    const sesionPersistida =
      obtenerSesionMemoria() ?? (await restaurarSesionCompleta());

    if (!sesionPersistida || !sesionPersistida.token) {
      return { ok: false, error: 'sin_sesion_previa' };
    }

    // No se inventa renovación de tokens (§3.2 / P-02):
    // la biometría solo permite el acceso posterior cuando el token sigue vigente (RNM-02).
    if (estaExpirada(sesionPersistida)) {
      return { ok: false, error: 'sesion_expirada' };
    }

    await guardarSesion(sesionPersistida);
    return { ok: true, sesion: sesionPersistida };
  },
};
