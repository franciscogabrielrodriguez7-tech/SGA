/**
 * Interfaz del adaptador de mapas — SGA Móvil
 *
 * Esta interfaz desacopla la implementación concreta de mapas/GPS.
 * No se elige proveedor real en esta etapa del MVP (DEP-INT-04).
 *
 * Estados de error contemplados:
 * - permiso_denegado: El usuario denegó permisos de ubicación
 * - gps_no_disponible: El dispositivo no tiene GPS o está desactivado
 * - direccion_no_encontrada: Geocodificación sin resultado
 * - error_conexion: Fallo de red al consultar el proveedor de mapas
 */

export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export interface PuntoRuta {
  coordenadas: Coordenadas;
  descripcion?: string;
}

export interface Ruta {
  origen: Coordenadas;
  destino: Coordenadas;
  puntos: PuntoRuta[];
  /** Distancia aproximada en kilómetros */
  distanciaKm: number;
  /** Duración estimada en minutos */
  duracionMin: number;
}

export type ErrorMapa =
  | 'permiso_denegado'
  | 'gps_no_disponible'
  | 'direccion_no_encontrada'
  | 'error_conexion';

export type ResultadoMapa<T> =
  | { ok: true; datos: T }
  | { ok: false; error: ErrorMapa };

export interface MapService {
  /**
   * Convierte una dirección y barrio en coordenadas geográficas.
   * DEP-INT-04: Integración pendiente con proveedor de geocodificación.
   */
  geocodificar(direccion: string, barrio: string): Promise<ResultadoMapa<Coordenadas>>;

  /**
   * Calcula una ruta entre dos puntos.
   * DEP-INT-04: Integración pendiente con proveedor de enrutamiento.
   */
  obtenerRuta(origen: Coordenadas, destino: Coordenadas): Promise<ResultadoMapa<Ruta>>;

  /**
   * Obtiene la ubicación actual del dispositivo.
   * DEP-INT-04: Requiere expo-location en integración real.
   */
  obtenerUbicacionActual(): Promise<ResultadoMapa<Coordenadas>>;
}
