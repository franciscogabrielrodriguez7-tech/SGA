/**
 * Adaptador mock del servicio de mapas — SGA Móvil
 *
 * IMPORTANTE: Este adaptador NO usa GPS real ni datos cartográficos reales.
 * Retorna coordenadas y rutas simuladas para validar el flujo de la UI.
 * El mapa que muestre la pantalla debe indicar claramente que es una
 * representación simulada (DEP-INT-04).
 *
 * Las coordenadas simuladas corresponden aproximadamente a Bogotá, Colombia.
 */

import type { MapService, Coordenadas, ResultadoMapa, Ruta } from '../MapService';

/** Escenario de error configurable para pruebas */
type EscenarioMapa = 'ok' | 'permiso_denegado' | 'gps_no_disponible' | 'direccion_no_encontrada' | 'error_conexion';

let _escenario: EscenarioMapa = 'ok';
export function fijarEscenarioMapa(e: EscenarioMapa): void {
  _escenario = e;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Coordenadas simuladas de referencia (Bogotá centro) */
const BASE_LAT = 4.711;
const BASE_LON = -74.0721;

/** Genera coordenadas aleatorias dentro de ~5 km del centro */
function coordenadasSimuladas(): Coordenadas {
  return {
    latitud: BASE_LAT + (Math.random() - 0.5) * 0.05,
    longitud: BASE_LON + (Math.random() - 0.5) * 0.05,
  };
}

export const mapServiceMock: MapService = {
  async geocodificar(direccion: string, _barrio: string): Promise<ResultadoMapa<Coordenadas>> {
    await delay(400);

    if (_escenario !== 'ok') {
      return { ok: false, error: _escenario === 'error_conexion' ? 'error_conexion' : 'direccion_no_encontrada' };
    }

    // Simulación: cualquier dirección retorna coordenadas cercanas al centro
    return { ok: true, datos: coordenadasSimuladas() };
  },

  async obtenerRuta(origen: Coordenadas, destino: Coordenadas): Promise<ResultadoMapa<Ruta>> {
    await delay(600);

    if (_escenario === 'error_conexion') {
      return { ok: false, error: 'error_conexion' };
    }

    const ruta: Ruta = {
      origen,
      destino,
      puntos: [
        { coordenadas: origen, descripcion: 'Punto de partida (simulado)' },
        {
          coordenadas: {
            latitud: (origen.latitud + destino.latitud) / 2,
            longitud: (origen.longitud + destino.longitud) / 2,
          },
          descripcion: 'Punto intermedio (simulado)',
        },
        { coordenadas: destino, descripcion: 'Destino (simulado)' },
      ],
      distanciaKm: parseFloat((Math.random() * 10 + 1).toFixed(1)),
      duracionMin: Math.floor(Math.random() * 30 + 5),
    };

    return { ok: true, datos: ruta };
  },

  async obtenerUbicacionActual(): Promise<ResultadoMapa<Coordenadas>> {
    await delay(300);

    if (_escenario === 'permiso_denegado') {
      return { ok: false, error: 'permiso_denegado' };
    }
    if (_escenario === 'gps_no_disponible') {
      return { ok: false, error: 'gps_no_disponible' };
    }

    return { ok: true, datos: coordenadasSimuladas() };
  },
};
