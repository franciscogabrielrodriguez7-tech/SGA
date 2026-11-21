import type { NavigatorScreenParams } from "@react-navigation/native";
import type { Alquiler } from "../types/models";

/** Parámetros para pantallas dentro del stack de Alquileres */
export type AlquileresStackParamList = {
  Lista: undefined;
  Detalle: { id: number };
  /** Registrar entrega — solo alquileres 'pendiente' */
  Entrega: { alquiler: AlquilerParaOperacion };
  /** Registrar recogida — solo alquileres 'activo' o 'vencido' */
  Recogida: { alquiler: AlquilerParaOperacion };
  /** Mapa simulado de ubicación del alquiler */
  Mapa: { alquiler: AlquilerParaOperacion };
};

/** Subconjunto de datos del alquiler necesario para las pantallas de operación */
export interface AlquilerParaOperacion {
  id: number;
  cliente_nombre: string;
  direccion_entrega: string;
  barrio?: string;
  estado: Alquiler['estado_alquiler'];
  productos: Array<{ nombre: string; cantidad: number }>;
}

export type RootTabParamList = {
  Inicio: undefined;
  Alquileres: NavigatorScreenParams<AlquileresStackParamList>;
  Gastos: undefined;
  Historial: undefined;
};
