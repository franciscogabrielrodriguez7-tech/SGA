/**
 * Interfaz del servicio de autenticación — SGA Móvil (§3.1 y §3.2)
 */

import type { ResultadoLogin, SesionUsuario } from '../types/auth';

export interface AuthService {
  /**
   * Inicia sesión con usuario/teléfono y contraseña.
   * Requiere conexión; nunca lanza excepción no controlada.
   */
  login(identificador: string, contrasena: string): Promise<ResultadoLogin>;

  /**
   * Cierra la sesión actual y elimina del dispositivo los elementos de autenticación,
   * el estado de sesión y la información privada local asociada al usuario.
   */
  cerrarSesion(id_usuario?: string): Promise<void>;

  /**
   * Devuelve la sesión persistida en el dispositivo, o null si no existe.
   * Incluye el token y su fecha de expiración para que la sesión persista al
   * cerrar y reabrir la aplicación mientras el token siga siendo válido (§3.2).
   */
  obtenerSesionActual(): Promise<SesionUsuario | null>;

  /**
   * Acceso biométrico en aperturas posteriores cuando existe una sesión con
   * token vigente (RNM-02).
   * No inventa renovación de tokens: si el token ya expiró, devuelve error
   * 'sesion_expirada' (§3.2 / P-02).
   */
  renovarBiometrico(): Promise<ResultadoLogin>;
}
