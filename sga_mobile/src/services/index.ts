// ÚNICO punto de sustitución: cuando exista la integración con la API
// (Fase 6), se reemplazan aquí los adaptadores simulados por los servicios reales.
// DEP-INT-01..10: contratos reales pendientes de validación con el backend del SGA.

import type { AlquileresService } from "./AlquileresService";
import { alquileresServiceMock } from "./mock/alquileresServiceMock";

import type { AuthService } from "./AuthService";
import { authServiceMock } from "./mock/authServiceMock";

import type { GastosService } from "./GastosService";
import { gastosServiceMock } from "./mock/gastosServiceMock";

import type { HistorialService } from "./HistorialService";
import { historialServiceMock } from "./mock/historialServiceMock";

import type { MapService } from "./MapService";
import { mapServiceMock } from "./mock/mapServiceMock";

export const alquileresService: AlquileresService = alquileresServiceMock;
export const authService: AuthService = authServiceMock;
export const gastosService: GastosService = gastosServiceMock;
export const historialService: HistorialService = historialServiceMock;
export const mapService: MapService = mapServiceMock;
