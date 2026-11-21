/**
 * Almacenamiento de sesión y separación de datos — SGA Móvil (§3.1 y §3.2)
 *
 * Distingue explícitamente cuatro categorías de información:
 * 1. Datos no sensibles del perfil (PerfilUsuarioNoSensible) -> AsyncStorage
 * 2. Elementos de autenticación (ElementosAutenticacion: token y expiraEn) -> SecureStorageAdapter
 * 3. Estado de sesión (MetadatosSesion) -> AsyncStorage
 * 4. Información privada almacenada localmente (DatosPrivadosLocalesUsuario) -> SecureStorageAdapter / aislado por usuario
 *
 * Cumple RNF-06 / RN-MOV-02:
 * - La sesión persiste al cerrar y volver a abrir la aplicación mientras el token
 *   siga siendo válido.
 * - Al cerrar sesión de forma confirmada, se eliminan los elementos de autenticación,
 *   el estado de sesión activo y la información privada local asociada a la sesión.
 *
 * DEP-INT-02: Se define la interfaz `SecureStorageAdapter` compatible con
 * `expo-secure-store` (`getItemAsync`, `setItemAsync`, `deleteItemAsync`).
 */

import type {
  DatosPrivadosLocalesUsuario,
  ElementosAutenticacion,
  MetadatosSesion,
  PerfilUsuarioNoSensible,
  SesionUsuario,
} from '../types/auth.ts';
import { kvGet, kvRemove, kvSet } from './kvAdapter.ts';

const CLAVE_PERFIL_NO_SENSIBLE = 'sga_mobile_perfil_no_sensible_v2';
const CLAVE_ELEMENTOS_AUTH = 'sga_mobile_auth_secreto_v2';
const CLAVE_ESTADO_SESION = 'sga_mobile_estado_sesion_v2';
const prefijoDatosPrivados = (id_usuario: string) =>
  `sga_mobile_privado_${id_usuario}_v2`;

/**
 * Interfaz de almacenamiento seguro preparada para `expo-secure-store` (DEP-INT-02).
 */
export interface SecureStorageAdapter {
  setItemAsync(clave: string, valor: string): Promise<void>;
  getItemAsync(clave: string): Promise<string | null>;
  deleteItemAsync(clave: string): Promise<void>;
}

async function leerStorageSeguro(clave: string): Promise<string | null> {
  return kvGet(clave);
}

async function escribirStorageSeguro(clave: string, valor: string): Promise<void> {
  await kvSet(clave, valor);
}

async function borrarStorageSeguro(clave: string): Promise<void> {
  await kvRemove(clave);
}

/**
 * Adaptador por defecto para el MVP (sustituible en Fase 6 por `expo-secure-store`).
 */
let adaptadorSeguro: SecureStorageAdapter = {
  async setItemAsync(clave, valor) {
    await escribirStorageSeguro(`__secure__:${clave}`, valor);
  },
  async getItemAsync(clave) {
    return leerStorageSeguro(`__secure__:${clave}`);
  },
  async deleteItemAsync(clave) {
    await borrarStorageSeguro(`__secure__:${clave}`);
  },
};

/** Permite inyectar `expo-secure-store` en la Fase 6 o un mock en pruebas */
export function configurarAdaptadorSeguro(nuevoAdaptador: SecureStorageAdapter): void {
  adaptadorSeguro = nuevoAdaptador;
}

/** Caché en memoria de la sesión durante la ejecución activa */
let sesionEnMemoria: SesionUsuario | null = null;

/**
 * Guarda la sesión separando cada categoría en su canal correspondiente (§3.2).
 */
export async function guardarSesion(sesion: SesionUsuario): Promise<void> {
  sesionEnMemoria = sesion;

  const perfilNoSensible: PerfilUsuarioNoSensible = {
    id_usuario: sesion.id_usuario,
    nombres: sesion.nombres,
    apellidos: sesion.apellidos,
    rol: sesion.rol,
  };

  const elementosAuth: ElementosAutenticacion = {
    token: sesion.token,
    expiraEn: sesion.expiraEn,
  };

  const ahoraISO = new Date().toISOString();
  const metadatos: MetadatosSesion = {
    id_usuario: sesion.id_usuario,
    establecidaEn: ahoraISO,
    ultimoAccesoEn: ahoraISO,
    biometriaHabilitada: true,
  };

  const datosPrivados: DatosPrivadosLocalesUsuario = {
    id_usuario: sesion.id_usuario,
    ultimaSincronizacionISO: ahoraISO,
  };

  await escribirStorageSeguro(
    CLAVE_PERFIL_NO_SENSIBLE,
    JSON.stringify(perfilNoSensible)
  );
  await adaptadorSeguro.setItemAsync(
    CLAVE_ELEMENTOS_AUTH,
    JSON.stringify(elementosAuth)
  );
  await escribirStorageSeguro(CLAVE_ESTADO_SESION, JSON.stringify(metadatos));
  await adaptadorSeguro.setItemAsync(
    prefijoDatosPrivados(sesion.id_usuario),
    JSON.stringify(datosPrivados)
  );
}

/**
 * Restaura la sesión completa (perfil no sensible + elementos de autenticación).
 * Permite que la sesión persista al cerrar y volver a abrir la app mientras el token
 * siga siendo válido (§3.2).
 */
export async function restaurarSesionCompleta(): Promise<SesionUsuario | null> {
  try {
    const rawPerfil = await leerStorageSeguro(CLAVE_PERFIL_NO_SENSIBLE);
    const rawAuth = await adaptadorSeguro.getItemAsync(CLAVE_ELEMENTOS_AUTH);
    if (!rawPerfil || !rawAuth) return null;

    const perfil = JSON.parse(rawPerfil) as PerfilUsuarioNoSensible;
    const auth = JSON.parse(rawAuth) as ElementosAutenticacion;

    if (!perfil?.id_usuario || !auth?.token || !auth?.expiraEn) {
      return null;
    }

    const sesionRestaurada: SesionUsuario = {
      ...perfil,
      token: auth.token,
      expiraEn: auth.expiraEn,
    };

    sesionEnMemoria = sesionRestaurada;
    return sesionRestaurada;
  } catch {
    return null;
  }
}

/** Obtiene los metadatos del estado de sesión (ej. si la biometría está habilitada) */
export async function obtenerMetadatosSesion(): Promise<MetadatosSesion | null> {
  try {
    const raw = await leerStorageSeguro(CLAVE_ESTADO_SESION);
    if (!raw) return null;
    return JSON.parse(raw) as MetadatosSesion;
  } catch {
    return null;
  }
}

/** Obtiene los datos privados locales asociados al usuario */
export async function obtenerDatosPrivadosUsuario(
  id_usuario: string
): Promise<DatosPrivadosLocalesUsuario | null> {
  try {
    const raw = await adaptadorSeguro.getItemAsync(prefijoDatosPrivados(id_usuario));
    if (!raw) return null;
    return JSON.parse(raw) as DatosPrivadosLocalesUsuario;
  } catch {
    return null;
  }
}

/** Devuelve la sesión actualmente cargada en memoria */
export function obtenerSesionMemoria(): SesionUsuario | null {
  return sesionEnMemoria;
}

/**
 * Simula el cierre y reapertura de la aplicación limpiando únicamente la variable
 * en memoria RAM, conservando el almacenamiento persistente del dispositivo.
 */
export function simularReinicioAppMemoria(): void {
  sesionEnMemoria = null;
}

/**
 * Actualiza la sesión en memoria y en el almacenamiento seguro (p. ej. al simular
 * expiración del token en el panel de pruebas).
 */
export async function actualizarSesionPersistida(sesion: SesionUsuario): Promise<void> {
  await guardarSesion(sesion);
}

/**
 * Elimina los elementos de autenticación, el estado de sesión y la información
 * privada almacenada localmente del usuario al confirmar el cierre de sesión (§3.1 / §3.2 / RNF-11).
 */
export async function eliminarSesion(id_usuario?: string): Promise<void> {
  const uid = id_usuario ?? sesionEnMemoria?.id_usuario;
  sesionEnMemoria = null;

  await adaptadorSeguro.deleteItemAsync(CLAVE_ELEMENTOS_AUTH);
  await borrarStorageSeguro(CLAVE_PERFIL_NO_SENSIBLE);
  await borrarStorageSeguro(CLAVE_ESTADO_SESION);

  if (uid) {
    await adaptadorSeguro.deleteItemAsync(prefijoDatosPrivados(uid));
  }
}
