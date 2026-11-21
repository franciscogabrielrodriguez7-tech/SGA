/**
 * Tipos del dominio de autenticación y sesión — SGA Móvil (§3.1 y §3.2)
 *
 * Separa explícitamente:
 * 1. Datos no sensibles del perfil (PerfilUsuarioNoSensible)
 * 2. Elementos de autenticación (ElementosAutenticacion — token y expiración)
 * 3. Estado de sesión (EstadoAuth y MetadatosSesion)
 * 4. Información privada almacenada localmente (DatosPrivadosLocalesUsuario)
 */

/** Rol del usuario autenticado */
export type RolUsuario = 'ENCARGADO_LOGISTICO' | 'ADMIN_O_FACTURACION';

/** 1. Datos no sensibles del usuario autenticado */
export interface PerfilUsuarioNoSensible {
  id_usuario: string;
  nombres: string;
  apellidos: string;
  rol: RolUsuario;
}

/** 2. Elementos de autenticación (destinados a almacenamiento seguro / expo-secure-store) */
export interface ElementosAutenticacion {
  /** Token JWT (simulado en el MVP) */
  token: string;
  /** ISO 8601 — fecha/hora de expiración del token */
  expiraEn: string;
}

/** 3. Metadatos del estado de la sesión en el dispositivo */
export interface MetadatosSesion {
  id_usuario: string;
  establecidaEn: string;
  ultimoAccesoEn: string;
  /** Permite acceso biométrico en accesos posteriores mientras el token siga vigente (RNM-02) */
  biometriaHabilitada: boolean;
}

/** 4. Información privada almacenada localmente vinculada a la sesión del usuario */
export interface DatosPrivadosLocalesUsuario {
  id_usuario: string;
  ultimaSincronizacionISO: string;
  preferenciasPrivadas?: Record<string, string>;
}

/** Sesión activa completa en tiempo de ejecución */
export interface SesionUsuario extends PerfilUsuarioNoSensible, ElementosAutenticacion {}

/** Estados posibles del flujo de autenticación */
export type EstadoAuth =
  | 'verificando'          // Revisando sesión persistida al arranque
  | 'sin_sesion'           // No hay sesión activa; mostrar LoginScreen
  | 'bloqueada_biometria'  // Sesión con token vigente bloqueada para probar acceso posterior biométrico (RNM-02)
  | 'con_sesion'           // Sesión válida y activa
  | 'expirada';            // Token expirado; requiere reautenticación (sin renovación automática P-01/P-02)

/** Credenciales de acceso (usuario o teléfono + contraseña) */
export interface CredencialesLogin {
  identificador: string;
  contrasena: string;
}

/** Tipos de error de autenticación */
export type ErrorAuth =
  | 'credenciales_invalidas'
  | 'usuario_deshabilitado'
  | 'sin_conexion'
  | 'sesion_expirada'
  | 'sin_sesion_previa'
  | 'error_desconocido';

/** Resultado de un intento de login o desbloqueo biométrico */
export type ResultadoLogin =
  | { ok: true; sesion: SesionUsuario }
  | { ok: false; error: ErrorAuth };

/**
 * Resultado al solicitar el cierre de sesión (§3.1):
 * - Si no hay operaciones pendientes (o si había conexión y se sincronizaron todas con éxito),
 *   listoParaCerrar = true.
 * - Si hay operaciones pendientes y no hay conexión (o falló la sincronización previa),
 *   listoParaCerrar = false y se devuelve el detalle para mostrar la advertencia obligatoria.
 */
export interface ResultadoSolicitudCierre {
  listoParaCerrar: boolean;
  pendientes: number;
  conectado: boolean;
  sincronizadasAntesDeCerrar: number;
  erroresSincronizacion: number;
  mensajeAdvertencia?: string;
}
